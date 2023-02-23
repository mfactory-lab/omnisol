mod utils;
mod cluster;

use std::path::PathBuf;
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
use omnisol::state::{User, Collateral};
use clap::Parser;
use solana_client::rpc_filter::{Memcmp, MemcmpEncodedBytes};
use crate::utils::{COLLATERAL_DISCRIMINATOR, generate_priority_queue, get_accounts, USER_DISCRIMINATOR};
use gimli::ReaderOffset;
use crate::cluster::Cluster;
use anchor_lang::prelude::borsh::BorshDeserialize;

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
            RpcFilterType::DataSize(User::SIZE.into_u64()),
            RpcFilterType::Memcmp(Memcmp {
                offset: 0,
                bytes: MemcmpEncodedBytes::Bytes(USER_DISCRIMINATOR.to_vec()),
                encoding: None,
            }),
        ]);

        // get User accounts
        let user_accounts = get_accounts(filters, &connection);

        // deserialize user data
        let mut user_data: Vec<(Pubkey, User)> = vec![];
        user_accounts.into_iter().for_each(|(address, account)| user_data.push((address, User::try_from_slice(account.data.as_slice()).unwrap())));

        // sort by rate
        user_data.sort_by(|(_, a), (_, b)| a.rate.cmp(&b.rate));

        let filters = Some(vec![
            RpcFilterType::DataSize(Collateral::SIZE.into_u64()),
            RpcFilterType::Memcmp(Memcmp {
                offset: 0,
                bytes: MemcmpEncodedBytes::Bytes(COLLATERAL_DISCRIMINATOR.to_vec()),
                encoding: None,
            }),
        ]);

        // get collateral accounts
        let collateral_accounts = get_accounts(filters, &connection);

        // deserialize collateral data
        let mut collateral_data: Vec<(Pubkey, Collateral)> = vec![];
        collateral_accounts.into_iter().for_each(|(address, account)| collateral_data.push((address, Collateral::try_from_slice(account.data.as_slice()).unwrap())));

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
