mod utils;

use std::path::PathBuf;
use std::str::FromStr;
use utils::{User, Collateral};
use solana_client::{
    rpc_client::RpcClient,
    rpc_filter::RpcFilterType,
};
use solana_sdk::{
    commitment_config::CommitmentConfig,
    system_program,
    pubkey::Pubkey,
    instruction::{AccountMeta, Instruction},
    signature::{read_keypair_file, Signer},
    transaction::Transaction
};
use omnisol::ID;
use clap::Parser;
use solana_client::rpc_filter::{Memcmp, MemcmpEncodedBytes};
use crate::utils::{COLLATERAL_DISCRIMINATOR, generate_priority_queue, get_accounts, USER_DISCRIMINATOR};
use gimli::ReaderOffset;
use solana_client::rpc_deprecated_config::RpcConfirmedTransactionConfig;
use solana_sdk::genesis_config::ClusterType;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
pub struct Args {
    /// Path to private key
    #[arg(short, long)]
    pub sign: PathBuf,

    /// Solana cluster name
    #[arg(short, long)]
    pub cluster: Cluster,

    /// Oracle address
    #[arg(short, long)]
    pub oracle: Pubkey,
}

#[derive(Clone, Debug)]
pub struct Cluster(String);

impl FromStr for Cluster {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let url = match s {
            "dev" => String::from("http://api.devnet.solana.com"),
            "main" => String::from("http://api.mainnet-beta.solana.com"),
            "test" => String::from("http://api.testnet.solana.com"),
            "local" => String::from("http://127.0.0.1:8899"),
            _ => Err(format!("{} is unrecognized for cluster type", s))?,
        };
        Ok(Cluster(url))
    }
}

impl ToString for Cluster {
    fn to_string(&self) -> String {
        self.0.clone()
    }
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
            RpcFilterType::DataSize(omnisol::state::User::SIZE.into_u64()),
            RpcFilterType::Memcmp(Memcmp {
                offset: 0,
                bytes: MemcmpEncodedBytes::Bytes(USER_DISCRIMINATOR.to_vec()),
                encoding: None,
            }),
        ]);

        // get User accounts
        let user_accounts = get_accounts(filters, &connection);

        // deserialize user data
        let mut user_data = vec![];
        user_accounts.into_iter().for_each(|(address, account)| user_data.push((address, User::unpack_from_slice(account.data.as_slice()).unwrap())));

        // sort by rate
        user_data.sort_by(|(_, a), (_, b)| b.rate.cmp(&a.rate));
        user_data.reverse();

        let filters = Some(vec![
            RpcFilterType::DataSize(omnisol::state::Collateral::SIZE.into_u64()),
            RpcFilterType::Memcmp(Memcmp {
                offset: 0,
                bytes: MemcmpEncodedBytes::Bytes(COLLATERAL_DISCRIMINATOR.to_vec()),
                encoding: None,
            }),
        ]);

        // get collateral accounts
        let collateral_accounts = get_accounts(filters, &connection);

        // deserialize collateral data
        let mut collateral_data = vec![];
        collateral_accounts.into_iter().for_each(|(address, account)| collateral_data.push((address, Collateral::unpack_from_slice(account.data.as_slice()).unwrap())));

        // find collaterals by user list and make priority queue
        let (collaterals, values) = generate_priority_queue(user_data, collateral_data);

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
        let recent_blockhash = connection.get_latest_blockhash().expect("Can't get blockhash");
        tx.sign(&vec![&wallet_keypair], recent_blockhash);
        connection.send_transaction(&tx).expect("Transaction failed.");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_priority_queue() {
        let pubkey_1 = Pubkey::new_unique();
        let user_1 = User { rate: 0 };
        let pubkey_2 = Pubkey::new_unique();
        let user_2 = User { rate: 100 };
        let pubkey_3 = Pubkey::new_unique();
        let user_3 = User { rate: 200 };
        let collateral_address_1 = Pubkey::new_unique();
        let collateral_address_2 = Pubkey::new_unique();
        let collateral_address_3 = Pubkey::new_unique();
        let collateral_address_4 = Pubkey::new_unique();
        let collateral_address_5 = Pubkey::new_unique();
        let collateral_1 = Collateral {
            user: pubkey_1,
            delegation_stake: 100,
            liquidated_amount: 100,
        };
        let collateral_2 = Collateral {
            user: pubkey_1,
            delegation_stake: 100,
            liquidated_amount: 0,
        };
        let collateral_3 = Collateral {
            user: pubkey_2,
            delegation_stake: 100,
            liquidated_amount: 50,
        };
        let collateral_4 = Collateral {
            user: pubkey_3,
            delegation_stake: 100,
            liquidated_amount: 0,
        };
        let collateral_5 = Collateral {
            user: pubkey_3,
            delegation_stake: 100,
            liquidated_amount: 99,
        };
        let user_data = vec![(pubkey_1, user_1), (pubkey_2, user_2), (pubkey_3, user_3)];
        let collateral_data = vec![
            (collateral_address_1, collateral_1),
            (collateral_address_2, collateral_2),
            (collateral_address_3, collateral_3),
            (collateral_address_4, collateral_4),
            (collateral_address_5, collateral_5)
        ];
        let result_1 = vec![collateral_address_2, collateral_address_3, collateral_address_4, collateral_address_5];
        let result_2 = vec![100, 50, 100, 1];
        assert_eq!(generate_priority_queue(user_data, collateral_data), (result_1, result_2));
    }
}
