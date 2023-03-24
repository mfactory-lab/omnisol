mod utils;

use std::{num::ParseIntError, path::PathBuf, rc::Rc, thread, time::Duration};
use std::collections::HashMap;

use anchor_client::{solana_sdk::{
    commitment_config::CommitmentConfig,
    pubkey::Pubkey,
    signature::{read_keypair_file, Signer},
    system_program,
    sysvar::clock,
    stake,
}, Client, Cluster, Program};
use anchor_client::solana_sdk::signature::Keypair;
use anchor_lang::prelude::AccountMeta;
use anchor_spl::token::spl_token;
use clap::Parser;
use log::{error, info, LevelFilter, warn};
use simplelog::{ColorChoice, Config, TermLogger, TerminalMode};
use omnisol::id;
use omnisol::state::{Collateral, Liquidator, Oracle, Pool, QueueMember, User, WithdrawInfo};

use crate::utils::{get_collateral_data, get_oracle_data, get_pool_data, get_user_data, get_withdraw_info_list};

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
    #[arg(value_parser = |arg: &str| -> Result<Duration, ParseIntError> {Ok(Duration::from_secs(arg.parse()?))})]
    pub sleep_duration: Duration,

    /// Unstake.it pool address
    #[arg(short, long)]
    pub pool: Pubkey,

    /// Unstake.it protocol fee address
    #[arg(short, long)]
    pub fee_protocol: Pubkey,

    /// Unstake.it destination fee address
    #[arg(short, long)]
    pub destination_fee: Pubkey,

    /// Unstake.it SOL reserves address
    #[arg(short, long)]
    pub reserves: Pubkey,

    /// Unstake.it address
    #[arg(short, long)]
    pub unstake_it: Pubkey,

    /// Fee account address
    #[arg(short, long)]
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

    // establish connection
    let client = Client::new_with_options(
        args.cluster.clone(),
        Rc::new(wallet_keypair),
        CommitmentConfig::confirmed(),
    );
    info!("Established connection: {}", &args.cluster.url());

    // get program public key
    let program = client.program(id());

    loop {
        let withdraw_info_list = get_withdraw_info_list(&program).expect("Can't get withdraw info list");
        info!("Got {} withdraw request(s))", withdraw_info_list.len());

        for (withdraw_address, withdraw_info) in withdraw_info_list {
            process_withdraw_request(&args, withdraw_address, withdraw_info, &program)
        }
    }
}

fn process_withdraw_request(args: &Args, withdraw_address: Pubkey, withdraw_info: WithdrawInfo, program: &Program) {
    info!("Withdraw request - {} in processing...", withdraw_address);

    let user_data = get_user_data(&program).expect("Can't get user accounts");
    info!("Got {} user(s)", user_data.len());

    let (user_key, _) = Pubkey::find_program_address(&[User::SEED, withdraw_info.authority.as_ref()], &id());
    let user = user_data
        .get(&user_key)
        .expect("Can't find user account");
    info!("Got data of user that made request - {}", user_key);

    if user.is_blocked {
        warn!("User {} is blocked", user.wallet);
        return;
    }

    let mut amount_to_liquidate = withdraw_info.amount;

    let oracle_data = get_oracle_data(&program, args.oracle).expect("Can't get oracle account");
    info!("Got oracle data");
    let pool_data = get_pool_data(&program).expect("Can't get pool accounts");
    let collateral_data = get_collateral_data(&program).expect("Can't get collateral accounts");
    info!("Got {} collateral(s)", collateral_data.len());

    while amount_to_liquidate > 0 {
        amount_to_liquidate = liquidate(args, program, withdraw_address, user_data.clone(), user_key, user, amount_to_liquidate, oracle_data.clone(), pool_data.clone(), collateral_data.clone());
    }
}

fn liquidate(
    args: &Args,
    program: &Program,
    withdraw_address: Pubkey,
    user_data: HashMap<Pubkey, User>,
    user_key: Pubkey,
    user: &User,
    amount_to_liquidate: u64,
    oracle_data: Oracle,
    pool_data: HashMap<Pubkey, Pool>,
    collateral_data: HashMap<Pubkey, Collateral>,
) -> u64 {
    let mut amount_to_liquidate = amount_to_liquidate;

    for queue_member in &oracle_data.priority_queue {
        info!("Thread is paused for {} seconds", args.sleep_duration.as_secs());
        thread::sleep(args.sleep_duration);

        let collateral = collateral_data
            .get(&queue_member.collateral)
            .expect("Can't find collateral account");

        let pool = pool_data
            .get(&collateral.pool)
            .expect("Can't find pool account");

        if !pool.is_active {
            warn!("Pool {} is paused. Impossible to liquidate collateral {}", collateral.pool, queue_member.collateral);
            continue
        };

        // find pool_authority
        let (pool_authority, _) = Pubkey::find_program_address(&[collateral.pool.as_ref()], &id());

        // find liquidator PDA
        let (liquidator_account, _) = Pubkey::find_program_address(&[Liquidator::SEED, args.liquidator.as_ref()], &id());

        let collateral_owner = user_data
            .get(&collateral.user)
            .expect("Can't find collateral owner account");
        info!("Got data of collateral owner - {}", collateral.user);

        // TODO: maybe should validate the state of user (if it blocked -> continue)

        let source_stake = collateral.get_source_stake();

        let additional_signer = Keypair::new();
        let (stake_account_record, remaining_accounts) = get_remaining_accounts(args, additional_signer.pubkey(), collateral, source_stake);

        let amount = if amount_to_liquidate >= queue_member.amount {
            queue_member.amount
        } else {
            amount_to_liquidate
        };

        // send tx to contract
        let result = program
            .request()
            .accounts(omnisol::accounts::LiquidateCollateral {
                pool: collateral.pool,
                pool_authority,
                collateral: queue_member.collateral,
                collateral_owner: collateral.user,
                collateral_owner_wallet: collateral_owner.wallet,
                user_wallet: user.wallet,
                user: user_key,
                withdraw_info: withdraw_address,
                oracle: args.oracle,
                source_stake,
                liquidator: liquidator_account,
                pool_account: args.pool,
                sol_reserves: args.reserves,
                protocol_fee: args.fee_protocol,
                protocol_fee_destination: args.destination_fee,
                fee_account: args.account_fee,
                stake_account_record,
                unstake_it_program: args.unstake_it,
                authority: args.liquidator,
                clock: clock::id(),
                token_program: spl_token::id(),
                stake_program: stake::program::id(),
                system_program: system_program::id(),
            })
            .accounts(remaining_accounts)
            .args(omnisol::instruction::LiquidateCollateral { amount })
            .signer(&additional_signer)
            .send();

        if let Ok(signature) = result.map_err(|e| error!("Liquidation failed with error - {}", e)) {
            info!("Sent transaction successfully with signature: {}", signature);

            if amount_to_liquidate < queue_member.amount {
                amount_to_liquidate = 0;
                break;
            } else {
                amount_to_liquidate -= queue_member.amount;
            }
        }
    }

    amount_to_liquidate
}

fn get_remaining_accounts(args: &Args, split_stake: Pubkey, collateral: &Collateral, source_stake: Pubkey) -> (Pubkey, Vec<AccountMeta>) {
    if collateral.is_native {
        let (stake_account_record, _) = Pubkey::find_program_address(&[args.pool.as_ref(), source_stake.as_ref()], &args.unstake_it);
        let remaining_accounts = vec![
            AccountMeta {
                pubkey: split_stake,
                is_signer: true,
                is_writable: true,
            },
        ];
        (stake_account_record, remaining_accounts)
    } else {
        let (stake_account_record, _) = Pubkey::find_program_address(&[args.pool.as_ref(), source_stake.as_ref()], &args.unstake_it);
        let remaining_accounts = vec![
            AccountMeta {
                pubkey: Default::default(),
                is_signer: false,
                is_writable: false,
            },
        ];
        (stake_account_record, remaining_accounts)
    }
}

// fn process_tx(
//     args: &Args,
//     program: &Program,
//     collateral: &Collateral,
//     pool_authority: Pubkey,
//     queue_member: QueueMember,
//     collateral_owner: &User,
//     user: User,
//     user_key: Pubkey,
//     withdraw_address: Pubkey,
//     source_stake: Pubkey,
//     liquidator_account: Pubkey,
//     stake_account_record: Pubkey,
//     remaining_accounts: Vec<AccountMeta>,
//     amount: u64,
//     additional_signer: Keypair,
// ) {
//     // send tx to contract
//     let result = program
//         .request()
//         .accounts(omnisol::accounts::LiquidateCollateral {
//             pool: collateral.pool,
//             pool_authority,
//             collateral: queue_member.collateral,
//             collateral_owner: collateral.user,
//             collateral_owner_wallet: collateral_owner.wallet,
//             user_wallet: user.wallet,
//             user: user_key,
//             withdraw_info: withdraw_address,
//             oracle: args.oracle,
//             source_stake,
//             liquidator: liquidator_account,
//             pool_account: args.pool,
//             sol_reserves: args.reserves,
//             protocol_fee: args.fee_protocol,
//             protocol_fee_destination: args.destination_fee,
//             fee_account: args.account_fee,
//             stake_account_record,
//             unstake_it_program: args.unstake_it,
//             authority: args.liquidator,
//             clock: clock::id(),
//             token_program: spl_token::id(),
//             stake_program: stake::program::id(),
//             system_program: system_program::id(),
//         })
//         .accounts(remaining_accounts)
//         .args(omnisol::instruction::LiquidateCollateral { amount })
//         .signer(&additional_signer)
//         .send();
//
//     if let Ok(signature) = result.map_err(|e| error!("Liquidation failed with error - {}", e)) {
//         info!("Sent transaction successfully with signature: {}", signature);
//     }
// }
