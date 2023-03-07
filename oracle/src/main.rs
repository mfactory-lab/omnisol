mod cluster;
mod utils;

use std::{path::PathBuf, thread};
use std::time::Duration;

use clap::Parser;
use log::{info, LevelFilter};
use omnisol::ID;
use simplelog::{ColorChoice, Config, TermLogger, TerminalMode};
use solana_client::rpc_client::RpcClient;

use std::rc::Rc;
use std::str::FromStr;

use anchor_client::solana_sdk::commitment_config::CommitmentConfig;
use anchor_client::solana_sdk::pubkey::Pubkey;
use anchor_client::solana_sdk::signature::{read_keypair_file, Signer};
use anchor_client::solana_sdk::signer::keypair::Keypair;
use anchor_client::solana_sdk::system_program;
use anchor_client::Client;

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
    pub sleep_duration: u64,
}

fn main() {
    let args = Args::parse();

    TermLogger::init(
        LevelFilter::Info,
        Config::default(),
        TerminalMode::Stdout,
        ColorChoice::Always,
    )
    .expect("Can't createPool logger");

    // get signer wallet
    let wallet_keypair = read_keypair_file(args.keypair).expect("Can't open keypair");
    let wallet_pubkey = wallet_keypair.pubkey();
    info!("Read oracle keypair file: {}", wallet_pubkey);

    let client = Client::new_with_options(
        anchor_client::Cluster::from_str(args.cluster.url()).unwrap(),
        Rc::new(wallet_keypair),
        CommitmentConfig::confirmed()
    );
    info!("Established connection: {}", args.cluster.url());

    // get program public key
    let program = client.program(omnisol::id());

    let mut previous_collaterals = vec![];
    let mut previous_values = vec![];

    loop {
        let user_data = get_user_data(&program).expect("Can't get user accounts");
        info!("Got user data");
        let collateral_data = get_collateral_data(&program).expect("Can't get collateral accounts");
        info!("Got collateral data");

        // find collaterals by user list and make priority queue
        let (collaterals, values) = generate_priority_queue(user_data, collateral_data);
        info!("Generated priority queue");
        info!("Collaterals - {:?}", collaterals);
        info!("Amounts - {:?}", values);

        if collaterals == previous_collaterals && values == previous_values {
            continue
        }

        // send tx to contract
        let signature = program
            .request()
            .accounts(omnisol::accounts::UpdateOracleInfo {
                authority: wallet_pubkey,
                oracle: args.oracle,
                system_program: system_program::id(),
            })
            .args(omnisol::instruction::UpdateOracleInfo {
                addresses: collaterals.clone(),
                values: values.clone(),
            })
            .send()
            .expect("Transaction failed.");

        info!("Sent transaction successfully with signature: {}", signature);

        previous_collaterals = collaterals;
        previous_values = values;

        thread::sleep(Duration::from_secs(args.sleep_duration));
    }
}
