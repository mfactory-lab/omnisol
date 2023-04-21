mod utils;

use std::{collections::HashMap, num::ParseIntError, path::PathBuf, rc::Rc, thread, time::Duration};

use anchor_client::{
    solana_client::rpc_client::RpcClient,
    solana_sdk::{
        borsh::try_from_slice_unchecked,
        commitment_config::CommitmentConfig,
        pubkey::Pubkey,
        signature::{read_keypair_file, Keypair, Signer},
        stake,
        stake_history::StakeHistory,
        system_program,
        sysvar::{clock, SysvarId},
        transaction::Transaction,
    },
    Client, ClientError, Cluster, Program,
};
use anchor_lang::prelude::AccountMeta;
use anchor_spl::{associated_token::get_associated_token_address, token::spl_token};
use clap::Parser;
use log::{error, info, warn, LevelFilter};
use omnisol::{
    id,
    state::{Collateral, Oracle, Pool, User, WithdrawInfo},
};
use simplelog::{ColorChoice, Config, TermLogger, TerminalMode};
use spl_stake_pool::{
    find_stake_program_address, find_withdraw_authority_program_address,
    state::{StakePool, ValidatorList},
    ID,
};

use crate::utils::{
    get_collateral_data, get_liquidator, get_oracle, get_oracle_data, get_pool_authority, get_pool_data,
    get_stake_account_record, get_token_whitelist, get_user, get_user_data, get_whitelisted_token_data,
    get_withdraw_info_list,
};

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
        let withdraw_info_list = get_withdraw_info_list(&liquidator.program).expect("Can't get withdraw info list");
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

pub struct Liquidator<'a> {
    args: Args,
    liquidator_wallet: Pubkey,
    liquidator_keypair: &'a Keypair,
    program: Program,
    oracle: Pubkey,
    liquidator: Pubkey,
    withdraw_address: Pubkey,
    user_data: HashMap<Pubkey, User>,
    user_key: Pubkey,
    amount_to_liquidate: u64,
    oracle_data: Oracle,
    pool_data: HashMap<Pubkey, Pool>,
    collateral_data: HashMap<Pubkey, Collateral>,
}

impl<'a> Liquidator<'a> {
    fn new(args: Args, client: Client, liquidator_keypair: &'a Keypair) -> Self {
        // get program public key
        let program = client.program(id());

        let oracle = get_oracle();
        let liquidator_wallet = liquidator_keypair.pubkey();
        let liquidator = get_liquidator(liquidator_wallet);

        Self {
            args,
            liquidator_wallet,
            liquidator_keypair,
            program,
            oracle,
            liquidator,
            withdraw_address: Default::default(),
            user_data: Default::default(),
            user_key: Default::default(),
            amount_to_liquidate: 0,
            oracle_data: Oracle {
                authority: Default::default(),
                priority_queue: vec![],
            },
            pool_data: Default::default(),
            collateral_data: Default::default(),
        }
    }

    fn process_withdraw_request(&mut self, withdraw_address: Pubkey, withdraw_info: WithdrawInfo) {
        info!("Withdraw request - {} in processing...", withdraw_address);

        let user_data = get_user_data(&self.program).expect("Can't get user accounts");
        info!("Got {} user(s)", self.user_data.len());

        self.user_data = user_data.clone();

        self.user_key = get_user(withdraw_info.authority);
        let user = user_data.get(&self.user_key).expect("Can't find user account");
        info!("Got data of user that made request - {}", self.user_key);

        if user.is_blocked {
            warn!("User {} is blocked", user.wallet);
            return;
        }

        self.amount_to_liquidate = withdraw_info.amount;

        self.oracle_data = get_oracle_data(&self.program, self.oracle).expect("Can't get oracle account");
        info!("Got oracle data");
        self.pool_data = get_pool_data(&self.program).expect("Can't get pool accounts");
        self.collateral_data = get_collateral_data(&self.program).expect("Can't get collateral accounts");
        info!("Got {} collateral(s)", self.collateral_data.len());

        self.withdraw_address = withdraw_address;

        // liquidate collaterals while withdraw request won't be processed
        while self.amount_to_liquidate > 0 {
            self.liquidate(user);
        }
    }

    fn liquidate(&mut self, user: &User) {
        // iterating threw the priority queue
        for queue_member in &self.oracle_data.priority_queue {
            let collateral = self
                .collateral_data
                .get(&queue_member.collateral)
                .expect("Can't find collateral account");

            let pool = self.pool_data.get(&collateral.pool).expect("Can't find pool account");

            if !pool.is_active {
                warn!(
                    "Pool {} is paused. Impossible to liquidate collateral {}",
                    collateral.pool, queue_member.collateral
                );
                continue;
            };

            // find pool_authority
            let pool_authority = get_pool_authority(collateral.pool);

            let collateral_owner = self
                .user_data
                .get(&collateral.user)
                .expect("Can't find collateral owner account");
            info!("Got data of collateral owner - {}", collateral.user);

            // TODO: maybe should validate the state of user (if it blocked -> continue)

            // get collateral's source stake address
            // it can be liquidity token mint address or delegated stake account address
            let source_stake = collateral.get_source_stake();

            // create additional_keypair for split stake account
            let additional_signer = Keypair::new();

            // get some remaining accounts
            let (stake_account_record, remaining_accounts) = self
                .get_remaining_accounts(
                    additional_signer.pubkey(),
                    collateral,
                    source_stake,
                    self.amount_to_liquidate,
                    queue_member.amount,
                    pool_authority,
                )
                .expect("Can't get remaining accounts");

            let amount = if self.amount_to_liquidate >= queue_member.amount {
                queue_member.amount
            } else {
                self.amount_to_liquidate
            };

            // send tx to contract
            let request = self
                .program
                .request()
                .accounts(omnisol::accounts::LiquidateCollateral {
                    pool: collateral.pool,
                    pool_authority,
                    collateral: queue_member.collateral,
                    collateral_owner: collateral.user,
                    collateral_owner_wallet: collateral_owner.wallet,
                    user_wallet: user.wallet,
                    user: self.user_key,
                    withdraw_info: self.withdraw_address,
                    oracle: self.oracle,
                    source_stake,
                    liquidator: self.liquidator,
                    pool_account: self.args.pool,
                    sol_reserves: self.args.reserves,
                    protocol_fee: self.args.fee_protocol,
                    protocol_fee_destination: self.args.destination_fee,
                    fee_account: self.args.account_fee,
                    stake_account_record,
                    unstake_it_program: self.args.unstake_it,
                    authority: self.liquidator_wallet,
                    clock: clock::id(),
                    token_program: spl_token::id(),
                    stake_program: stake::program::id(),
                    system_program: system_program::id(),
                })
                .accounts(remaining_accounts)
                .args(omnisol::instruction::LiquidateCollateral { amount })
                .signer(&additional_signer);

            let instructions = request.instructions().expect("");

            let signers: Vec<&dyn Signer> = vec![self.liquidator_keypair, &additional_signer];

            let rpc_client = RpcClient::new_with_commitment(
                String::from("https://api.testnet.solana.com"),
                CommitmentConfig::confirmed(),
            );

            let tx = {
                let latest_hash = rpc_client.get_latest_blockhash().expect("");
                Transaction::new_signed_with_payer(&instructions, Some(&self.liquidator_wallet), &signers, latest_hash)
            };
            info!("Raw transaction: {}", base64::encode(&tx.message_data()));

            let result = request.send();

            if let Ok(signature) = result.map_err(|e| error!("Liquidation failed with an error - {}", e)) {
                info!("Sent transaction successfully with signature: {}", signature);

                self.amount_to_liquidate -= amount;
                if self.amount_to_liquidate == 0 {
                    break;
                }
            }
        }
    }

    fn get_remaining_accounts(
        &self,
        split_stake: Pubkey,
        collateral: &Collateral,
        source_stake: Pubkey,
        withdraw_amount: u64,
        rest_amount: u64,
        pool_authority: Pubkey,
    ) -> Result<(Pubkey, Vec<AccountMeta>), ClientError> {
        // check if collateral's delegation is native stake or liquidity pool token
        // any of this types need it's own list of remaining accounts
        if collateral.is_native {
            let stake_account = if withdraw_amount < rest_amount {
                split_stake
            } else {
                source_stake
            };
            let stake_account_record = get_stake_account_record(self.args.pool, stake_account, self.args.unstake_it);

            // get list of remaining accounts
            let remaining_accounts = vec![AccountMeta {
                pubkey: split_stake,
                is_signer: true,
                is_writable: true,
            }];
            Ok((stake_account_record, remaining_accounts))
        } else {
            let stake_account_record = get_stake_account_record(self.args.pool, split_stake, self.args.unstake_it);

            // get whitelist data to fetch additional token info
            let token_whitelist = get_token_whitelist(collateral.stake_source);
            let whitelisted_token_data = get_whitelisted_token_data(&self.program, token_whitelist)?;

            // get additional data from staking pool program
            let (stake_pool_withdraw_authority, _) =
                find_withdraw_authority_program_address(&ID, &whitelisted_token_data.pool);
            let stake_pool_data = self
                .program
                .rpc()
                .get_account_data(&whitelisted_token_data.pool)
                .unwrap();
            let stake_pool = try_from_slice_unchecked::<StakePool>(stake_pool_data.as_slice()).unwrap();
            let validator_list_data = self.program.rpc().get_account_data(&stake_pool.validator_list).unwrap();
            let validator_list = try_from_slice_unchecked::<ValidatorList>(validator_list_data.as_slice()).unwrap();
            let amount = if withdraw_amount < rest_amount {
                withdraw_amount
            } else {
                rest_amount
            };
            let mut split_of = stake_pool.reserve_stake;
            for validator_stake in validator_list.validators {
                if validator_stake.stake_lamports() >= amount {
                    (split_of, _) = find_stake_program_address(
                        &ID,
                        &validator_stake.vote_account_address,
                        &whitelisted_token_data.pool,
                    );
                }
            }
            let pool_token_account = get_associated_token_address(&pool_authority, &whitelisted_token_data.mint);

            // get list of remaining accounts
            let remaining_accounts = vec![
                AccountMeta {
                    pubkey: ID,
                    is_signer: false,
                    is_writable: false,
                },
                AccountMeta {
                    pubkey: whitelisted_token_data.pool,
                    is_signer: false,
                    is_writable: true,
                },
                AccountMeta {
                    pubkey: stake_pool_withdraw_authority,
                    is_signer: false,
                    is_writable: false,
                },
                AccountMeta {
                    pubkey: stake_pool.reserve_stake,
                    is_signer: false,
                    is_writable: true,
                },
                AccountMeta {
                    pubkey: stake_pool.manager_fee_account,
                    is_signer: false,
                    is_writable: true,
                },
                AccountMeta {
                    pubkey: StakeHistory::id(),
                    is_signer: false,
                    is_writable: false,
                },
                AccountMeta {
                    pubkey: stake_pool.validator_list,
                    is_signer: false,
                    is_writable: true,
                },
                AccountMeta {
                    pubkey: split_of,
                    is_signer: false,
                    is_writable: true,
                },
                AccountMeta {
                    pubkey: split_stake,
                    is_signer: true,
                    is_writable: true,
                },
                AccountMeta {
                    pubkey: pool_token_account,
                    is_signer: false,
                    is_writable: true,
                },
            ];
            Ok((stake_account_record, remaining_accounts))
        }
    }
}
