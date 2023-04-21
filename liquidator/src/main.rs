mod utils;
mod liquidator;

use std::{num::ParseIntError, path::PathBuf, rc::Rc, thread, time::Duration};

use anchor_client::{solana_sdk::{
    commitment_config::CommitmentConfig,
    pubkey::Pubkey,
    signature::{read_keypair_file, Signer},
}, Client, Cluster};
use clap::Parser;
use log::{error, info, LevelFilter};

use simplelog::{ColorChoice, Config, TermLogger, TerminalMode};

use crate::utils::get_withdraw_info_list;

use liquidator::*;

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

    /// Sleep duration in seconds for external loop
    #[arg(short, long, value_name = "EXTERNAL_SLEEP", env = "EXTERNAL_SLEEP")]
    #[arg(value_parser = |arg: &str| -> Result<Duration, ParseIntError> {Ok(Duration::from_secs(arg.parse()?))})]
    pub external_sleep_duration: Duration,

    /// Sleep duration in seconds for internal loop
    #[arg(short, long, value_name = "INTERNAL_SLEEP", env = "INTERNAL_SLEEP")]
    #[arg(value_parser = |arg: &str| -> Result<Duration, ParseIntError> {Ok(Duration::from_secs(arg.parse()?))})]
    pub internal_sleep_duration: Duration,

    /// Unstake.it pool address
    #[arg(short, long, value_name = "POOL", env = "POOL")]
    pub pool: Pubkey,

    /// Unstake.it protocol fee address
    #[arg(short, long, value_name = "PROTOCOL_FEE", env = "PROTOCOL_FEE")]
    pub fee_protocol: Pubkey,

    /// Unstake.it destination fee address
    #[arg(short, long, value_name = "DESTINATION_FEE", env = "DESTINATION_FEE")]
    pub destination_fee: Pubkey,

    /// Unstake.it SOL reserves address
    #[arg(short, long, value_name = "SOL_RESERVES", env = "SOL_RESERVES")]
    pub reserves: Pubkey,

    /// Unstake.it address
    #[arg(short, long, value_name = "UNSTAKE_IT", env = "UNSTAKE_IT")]
    pub unstake_it: Pubkey,

    /// Fee account address
    #[arg(short, long, value_name = "FEE_ACCOUNT", env = "FEE_ACCOUNT")]
    pub account_fee: Pubkey,
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
    let wallet_keypair = read_keypair_file(&args.keypair).expect("Can't open keypair");
    let wallet_pubkey = wallet_keypair.pubkey();
    info!("Read liquidator keypair file: {}", wallet_pubkey);

    let signer = Rc::new(wallet_keypair);

    // establish connection
    let client = Client::new_with_options(args.cluster.clone(), signer.clone(), CommitmentConfig::confirmed());
    info!("Established connection: {}", &args.cluster.url());

    let mut liquidator = Liquidator::new(args, client, signer.as_ref());

    loop {
        info!(
            "Thread is paused for {} seconds",
            liquidator.args.external_sleep_duration.as_secs()
        );
        thread::sleep(liquidator.args.external_sleep_duration);

        // get withdraw requests sorted by creation time
        let withdraw_info_list = match get_withdraw_info_list(&liquidator.program) {
            Ok(withdraw_info_list) => withdraw_info_list,
            Err(e) => {
                error!("Can't get withdraw info list: {}", e);
                continue;
            }
        };
        info!("Got {} withdraw request(s))", withdraw_info_list.len());

        for (withdraw_address, withdraw_info) in withdraw_info_list {
            info!(
                "Thread is paused for {} seconds",
                liquidator.args.internal_sleep_duration.as_secs()
            );
            thread::sleep(liquidator.args.internal_sleep_duration);

            liquidator.process_withdraw_request(withdraw_address, withdraw_info);
        }
    }
}
