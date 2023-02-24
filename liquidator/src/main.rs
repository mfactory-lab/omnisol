mod cluster;
mod utils;

use std::{path::PathBuf, thread, time};

use clap::Parser;
use log::{info, LevelFilter};
use simplelog::{ColorChoice, Config, TermLogger, TerminalMode};
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    commitment_config::CommitmentConfig,
    pubkey::Pubkey,
    signature::{read_keypair_file, Signer},
};

use crate::{
    cluster::Cluster,
    utils::{get_oracle_data, get_user_data, get_withdraw_info_list},
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

    /// Liquidator address
    #[arg(short, long)]
    pub liquidator: Pubkey,

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
    .expect("Can't init logger");

    // get cluster and establish connection
    let client = RpcClient::new_with_commitment(args.cluster.url(), CommitmentConfig::confirmed());
    info!("Established connection: {}", client.url());

    // get signer wallet
    let wallet_keypair = read_keypair_file(args.keypair).expect("Can't open file-wallet");
    let wallet_pubkey = wallet_keypair.pubkey();
    info!("Read liquidator keypair file: {}", wallet_pubkey);

    loop {
        let withdraw_info_list = get_withdraw_info_list(&client).expect("Can't get withdraw info list");
        info!("Got withdraw requests list");

        for (withdraw_address, withdraw_info) in withdraw_info_list {
            info!("Withdraw request - {} in processing...", withdraw_address);

            // TODO maybe need to get batch of users (get_user_list) outside the loop
            let (user_key, user_data) = get_user_data(&client, withdraw_info.authority).expect("Can't get user data");
            info!("Got data of user that made request - {}", user_key);

            if user_data.is_blocked {
                continue;
            }

            let mut amount_to_liquidate = withdraw_info.amount;

            // TODO check location
            let oracle_data = get_oracle_data(&client, &args.oracle).expect("Can't get oracle data");
            info!("Got oracle data");

            while amount_to_liquidate > 0 {
                for queue_member in &oracle_data.priority_queue {
                    // TODO send transaction

                    thread::sleep(time::Duration::from_secs(args.time));

                    if amount_to_liquidate < queue_member.amount {
                        amount_to_liquidate = 0;
                        break;
                    } else {
                        amount_to_liquidate -= queue_member.amount;
                    }
                }
            }
        }
    }
}
