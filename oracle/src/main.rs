mod cluster;
mod utils;

use std::{collections::HashMap, num::ParseIntError, path::PathBuf, rc::Rc, str::FromStr, thread, time::Duration};

use anchor_client::{
    solana_sdk::{
        commitment_config::CommitmentConfig,
        pubkey::Pubkey,
        signature::{read_keypair_file, Signer},
        system_program,
    },
    Client,
};
use clap::Parser;
use log::{info, LevelFilter};
use simplelog::{ColorChoice, Config, TermLogger, TerminalMode};

use crate::{
    cluster::Cluster,
    utils::{generate_priority_queue, get_collateral_data, get_user_data},
};

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

    let client = Client::new_with_options(
        anchor_client::Cluster::from_str(args.cluster.url()).unwrap(),
        Rc::new(wallet_keypair),
        CommitmentConfig::confirmed(),
    );
    info!("Established connection: {}", args.cluster.url());

    // get program public key
    let program = client.program(omnisol::id());

    let mut previous_queue = HashMap::new();

    loop {
        thread::sleep(args.sleep_duration);

        let user_data = get_user_data(&program).expect("Can't get user accounts");
        info!("Got {} user(s)", user_data.len());
        let collateral_data = get_collateral_data(&program).expect("Can't get collateral accounts");
        info!("Got {} collateral(s)", collateral_data.len());

        // find collaterals by user list and make priority queue
        let queue = generate_priority_queue(user_data, collateral_data);
        info!("Generated priority queue: {:?}", queue);

        if previous_queue == queue {
            continue;
        }

        let (addresses, values) =
            queue
                .clone()
                .into_iter()
                .fold((vec![], vec![]), |(mut addresses, mut values), (a, v)| {
                    addresses.push(a);
                    values.push(v);
                    (addresses, values)
                });

        // send tx to contract
        // let signature = program
        //     .request()
        //     .accounts(omnisol::accounts::UpdateOracleInfo {
        //         authority: wallet_pubkey,
        //         oracle: args.oracle,
        //         system_program: system_program::id(),
        //     })
        //     .args(omnisol::instruction::UpdateOracleInfo { addresses, values })
        //     .send()
        //     .expect("Transaction failed.");
        //
        // info!("Sent transaction successfully with signature: {}", signature);

        previous_queue = queue;
    }
}
