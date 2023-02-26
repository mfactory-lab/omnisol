mod cluster;
mod utils;

use std::{path::PathBuf, thread, time};

use clap::Parser;
use log::{info, LevelFilter};
use omnisol::ID;
use simplelog::{ColorChoice, Config, TermLogger, TerminalMode};
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    commitment_config::CommitmentConfig,
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signature::{read_keypair_file, Signer},
    system_program,
    transaction::Transaction,
};

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
    pub time: u64,
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

    // get cluster and establish connection
    let client = RpcClient::new_with_commitment(args.cluster.url(), CommitmentConfig::confirmed());
    info!("Established connection: {}", client.url());

    // get signer wallet
    let wallet_keypair = read_keypair_file(args.keypair).expect("Can't open keypair");
    let wallet_pubkey = wallet_keypair.pubkey();
    info!("Read oracle keypair file: {}", wallet_pubkey);

    loop {
        let user_data = get_user_data(&client).expect("Can't get user accounts");
        info!("Got user data");
        let collateral_data = get_collateral_data(&client).expect("Can't get collateral accounts");
        info!("Got collateral data");

        // find collaterals by user list and make priority queue
        let (collaterals, values) = generate_priority_queue(user_data, collateral_data);
        info!(
            "Generated priority queue: \n\t\tCollaterals - {:?} \n\t\tAmounts - {:?}",
            collaterals, values
        );

        // send tx to contract
        let instructions = vec![Instruction::new_with_borsh(
            Pubkey::new_from_array(ID.to_bytes()),
            &omnisol::instruction::UpdateOracleInfo {
                addresses: collaterals,
                values,
            },
            vec![
                AccountMeta::new(wallet_pubkey, true),
                AccountMeta::new(args.oracle, false),
                AccountMeta::new(system_program::id(), false),
            ],
        )];
        let mut tx = Transaction::new_with_payer(&instructions, Some(&wallet_pubkey));
        let recent_blockhash = client.get_latest_blockhash().expect("Can't get blockhash");
        tx.sign(&vec![&wallet_keypair], recent_blockhash);
        let signature = client.send_transaction(&tx).expect("Transaction failed.");
        info!("Sent transaction successfully with signature: {}", signature);

        thread::sleep(time::Duration::from_secs(args.time));
    }
}
