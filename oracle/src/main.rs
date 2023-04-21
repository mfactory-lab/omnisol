mod utils;

use std::{collections::HashMap, num::ParseIntError, path::PathBuf, rc::Rc, thread, time::Duration};

use anchor_client::{solana_sdk::{
    commitment_config::CommitmentConfig,
    signature::{read_keypair_file, Signer},
    system_program,
}, Client, Cluster};
use clap::Parser;
use log::{info, error, LevelFilter};
use omnisol::{id, state::Oracle};
use simplelog::{ColorChoice, Config, TermLogger, TerminalMode};

use crate::utils::{generate_priority_queue, get_collateral_data, get_oracle_address, get_pool_data, get_user_data};

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
pub struct Args {
    /// Path to private key
    #[arg(
        short,
        long,
        value_name = "KEYPAIR",
        env = "KEYPAIR",
        default_value = "../keypair.json"
    )]
    pub keypair: PathBuf,

    /// Solana cluster name
    #[arg(short, long, value_name = "CLUSTER", env = "CLUSTER")]
    pub cluster: Cluster,

    /// Sleep duration in seconds
    #[arg(short, long, value_name = "SLEEP", env = "SLEEP")]
    #[arg(value_parser = |arg: &str| -> Result<Duration, ParseIntError> {Ok(Duration::from_secs(arg.parse()?))})]
    pub sleep_duration: Duration,
}

fn main() {
    let args = Args::parse();

    TermLogger::init(
        LevelFilter::Info,
        Config::default(),
        TerminalMode::Stdout,
        ColorChoice::Always,
    )
    .expect("Can't init logger");

    // get signer wallet
    let wallet_keypair = read_keypair_file(args.keypair).expect("Can't open keypair");
    let wallet_pubkey = wallet_keypair.pubkey();
    info!("Oracle keypair file: {}", wallet_pubkey);

    // establish connection
    let client = Client::new_with_options(
        args.cluster.clone(),
        Rc::new(wallet_keypair),
        CommitmentConfig::confirmed(),
    );
    info!("Established connection: {}", args.cluster.url());

    // get program public key
    let program = client.program(id());

    let mut previous_queue = HashMap::new();

    // find oracle PDA
    let oracle = get_oracle_address();

    loop {
        info!("Thread is paused for {} seconds", args.sleep_duration.as_secs());
        thread::sleep(args.sleep_duration);

        let user_data = match get_user_data(&program) {
            Ok(user_data) => user_data,
            Err(e) => {
                error!("Can't get user accounts: {}", e);
                continue;
            }
        };
        info!("Got {} user(s)", user_data.len());
        let collateral_data = match get_collateral_data(&program) {
            Ok(collateral_data) => collateral_data,
            Err(e) => {
                error!("Can't get collateral accounts: {}", e);
                continue;
            }
        };
        info!("Got {} collateral(s)", collateral_data.len());
        let pool_data = match get_pool_data(&program) {
            Ok(pool_data) => pool_data,
            Err(e) => {
                error!("Can't get pool accounts: {}", e);
                continue;
            }
        };

        // find collaterals by user list and make priority queue
        let queue = generate_priority_queue(user_data, collateral_data, pool_data);
        info!("Generated priority queue: {:?}", queue);

        if previous_queue == queue {
            info!("No changes in priority queue");
            continue;
        }

        let (mut addresses, mut values) =
            queue
                .clone()
                .into_iter()
                .fold((vec![], vec![]), |(mut addresses, mut values), (a, v)| {
                    addresses.push(a);
                    values.push(v);
                    (addresses, values)
                });

        let mut clear = true;
        let mut batches_amount = addresses.len() / Oracle::MAX_BATCH_LENGTH;

        let last_batch_len = addresses.len() - (batches_amount * Oracle::MAX_BATCH_LENGTH);
        if last_batch_len > 0 {
            batches_amount += 1;
        }

        let mut address_batches = vec![];
        let mut value_batches = vec![];

        for batch_id in 0..batches_amount {
            let batch_len = if batch_id == batches_amount - 1 {
                last_batch_len
            } else {
                Oracle::MAX_BATCH_LENGTH
            };
            let new_addresses: Vec<_> = addresses.drain(0..batch_len).collect();
            let new_values: Vec<_> = values.drain(0..batch_len).collect();
            address_batches.push(new_addresses);
            value_batches.push(new_values);
        }

        for (addresses, values) in address_batches.into_iter().zip(value_batches.into_iter()) {
            // send tx to contract
            let signature = program
                .request()
                .accounts(omnisol::accounts::UpdateOracleInfo {
                    authority: wallet_pubkey,
                    oracle,
                    system_program: system_program::id(),
                })
                .args(omnisol::instruction::UpdateOracleInfo {
                    addresses,
                    values,
                    clear,
                })
                .send()
                .expect("Transaction failed.");

            info!("Sent transaction successfully with signature: {}", signature);
            clear = false;
        }

        previous_queue = queue;
    }
}
