mod cluster;
mod utils;

use std::path::PathBuf;

use clap::Parser;
use gimli::ReaderOffset;
use omnisol::{
    state::{User, WithdrawInfo},
    ID,
};
use solana_client::{
    rpc_client::RpcClient,
    rpc_filter::{Memcmp, MemcmpEncodedBytes, RpcFilterType},
};
use solana_sdk::{
    commitment_config::CommitmentConfig,
    pubkey::Pubkey,
    signature::{read_keypair_file, Signer},
};

use crate::{
    cluster::Cluster,
    utils::{get_accounts, oracle_from_slice, user_from_slice, withdraw_info_from_slice, WITHDRAW_INFO_DISCRIMINATOR},
};

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
pub struct Args {
    /// Path to private key
    #[arg(short, long)]
    pub sign: PathBuf,

    /// Solana cluster name
    #[arg(short, long)]
    pub cluster: Cluster,

    /// Liquidator address
    #[arg(short, long)]
    pub liquidator: Pubkey,

    /// Oracle address
    #[arg(short, long)]
    pub oracle: Pubkey,
}

fn main() {
    let args = Args::parse();

    // get cluster and establish connection
    let connection = RpcClient::new_with_commitment(args.cluster, CommitmentConfig::confirmed());

    // get signer wallet
    let wallet_path = args.sign;
    let wallet_keypair = read_keypair_file(wallet_path).expect("Can't open file-wallet");
    let wallet_pubkey = wallet_keypair.pubkey();

    loop {
        let filters = Some(vec![
            RpcFilterType::DataSize(WithdrawInfo::SIZE.into_u64()),
            RpcFilterType::Memcmp(Memcmp {
                offset: 0,
                bytes: MemcmpEncodedBytes::Bytes(WITHDRAW_INFO_DISCRIMINATOR.to_vec()),
                encoding: None,
            }),
        ]);

        // get WithdrawInfo accounts
        let withdraw_info_accounts = get_accounts(filters, &connection);

        // deserialize withdraw data
        let mut withdraw_info_data = vec![];
        withdraw_info_accounts.into_iter().for_each(|(address, account)| {
            withdraw_info_data.push((address, withdraw_info_from_slice(account.data.as_slice()).unwrap()))
        });

        // sort by creation time
        withdraw_info_data.sort_by(|(_, a), (_, b)| a.created_at.cmp(&b.created_at));

        for (withdraw_address, withdraw_info) in withdraw_info_data {
            // find user account
            let (user_account, _) = Pubkey::find_program_address(&[User::SEED, withdraw_info.authority.as_ref()], &ID);

            // get user data
            let user_data = connection.get_account_data(&user_account).unwrap();

            // deserialize user data
            let user_data = user_from_slice(user_data.as_slice()).unwrap();

            if user_data.is_blocked {
                continue;
            }

            let mut amount_to_liquidate = withdraw_info.amount;

            while amount_to_liquidate > 0 {
                // get oracle data
                let oracle_data = connection.get_account_data(&args.oracle).unwrap();

                // deserialize oracle data
                let oracle_data = oracle_from_slice(oracle_data.as_slice()).unwrap();

                for queue_member in oracle_data.priority_queue {
                    // TODO send transaction

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
