mod utils;

use std::{collections::HashMap, num::ParseIntError, path::PathBuf, rc::Rc, thread, time::Duration};

use anchor_client::{
    solana_sdk::{
        commitment_config::CommitmentConfig,
        pubkey::Pubkey,
        signature::{read_keypair_file, Signer},
        system_program,
    },
    Client, Cluster,
};
use clap::Parser;
use log::{info, LevelFilter};
use simplelog::{ColorChoice, Config, TermLogger, TerminalMode};
use omnisol::state::Oracle;

use crate::utils::{generate_priority_queue, get_collateral_data, get_pool_data, get_user_data};

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
pub struct Args {
    /// Path to private key
    #[arg(short, long)]
    pub keypair: PathBuf,

    /// Solana cluster name
    #[arg(short, long)]
    pub cluster: Cluster,

    /// Oracle address
    #[arg(short, long)]
    pub oracle: Pubkey,

    /// Sleep duration in seconds
    #[arg(short, long)]
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
    let program = client.program(omnisol::id());

    let mut previous_queue = HashMap::new();

    loop {
        info!("Thread is paused for {} seconds", args.sleep_duration.as_secs());
        thread::sleep(args.sleep_duration);

        let user_data = get_user_data(&program).expect("Can't get user accounts");
        info!("Got {} user(s)", user_data.len());
        let collateral_data = get_collateral_data(&program).expect("Can't get collateral accounts");
        info!("Got {} collateral(s)", collateral_data.len());
        let pool_data = get_pool_data(&program).expect("Can't get pool accounts");

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

        let mut to_clear = true;
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
                    oracle: args.oracle,
                    system_program: system_program::id(),
                })
                .args(omnisol::instruction::UpdateOracleInfo { addresses, values, to_clear })
                .send()
                .expect("Transaction failed.");

            info!("Sent transaction successfully with signature: {}", signature);
            to_clear = false;
        }

        previous_queue = queue;
    }
}
