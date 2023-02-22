mod cluster;
mod utils;

use std::path::PathBuf;

use clap::Parser;
use omnisol::{
    state::{Collateral, User},
    ID,
};
use solana_client::{
    rpc_client::RpcClient,
    rpc_filter::{Memcmp, MemcmpEncodedBytes, RpcFilterType},
};
use solana_sdk::{
    commitment_config::CommitmentConfig,
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signature::{read_keypair_file, Keypair, Signer},
    system_program,
    transaction::Transaction,
};

use crate::{
    cluster::Cluster,
    utils::{generate_priority_queue, get_accounts, COLLATERAL_DISCRIMINATOR, USER_DISCRIMINATOR},
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
}

fn main() {
    let args = Args::parse();

    // get cluster and establish connection
    let client = RpcClient::new_with_commitment(args.cluster, CommitmentConfig::confirmed());

    // get signer wallet
    let wallet_keypair = read_keypair_file(args.keypair).expect("Can't open keypair");
    let wallet_pubkey = wallet_keypair.pubkey();

    loop {
        let user_data = get_user_data(&client);
        let collateral_data = get_collateral_data(&client);

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
        let recent_blockhash = client.get_latest_blockhash().expect("Can't get blockhash");
        tx.sign(&vec![&wallet_keypair], recent_blockhash);
        client.send_transaction(&tx).expect("Transaction failed.");
    }
}

fn get_user_data(client: &RpcClient) -> Vec<(Pubkey, User)> {
    let accounts = get_accounts(
        Some(vec![
            RpcFilterType::DataSize(User::SIZE.into_u64()),
            RpcFilterType::Memcmp(Memcmp {
                offset: 0,
                bytes: MemcmpEncodedBytes::Bytes(USER_DISCRIMINATOR.to_vec()),
                encoding: None,
            }),
        ]),
        client,
    );

    let mut user_data = accounts
        .into_iter()
        .map(|(address, account)| {
            let user = User::try_from_slice(account.data.as_slice()).expect("Failed to deserialize");
            // (address, user_from_slice(account.data.as_slice()).unwrap())
            (address, user)
        })
        .collect::<Vec<_>>();

    // sort by rate
    user_data.sort_by(|(_, a), (_, b)| a.rate.cmp(&b.rate));

    user_data
}

fn get_collateral_data(client: &RpcClient) -> Vec<(Pubkey, Collateral)> {
    let accounts = get_accounts(
        Some(vec![
            RpcFilterType::DataSize(Collateral::SIZE.into_u64()),
            RpcFilterType::Memcmp(Memcmp {
                offset: 0,
                bytes: MemcmpEncodedBytes::Bytes(COLLATERAL_DISCRIMINATOR.to_vec()),
                encoding: None,
            }),
        ]),
        client,
    );

    accounts
        .into_iter()
        .map(|(address, account)| {
            let collateral = Collateral::try_from_slice(account.data.as_slice()).expect("Failed to deserialize");
            // (address, collateral_from_slice(account.data.as_slice()).unwrap())
            (address, collateral)
        })
        .collect::<Vec<_>>()
}
