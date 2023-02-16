mod utils;

use utils::{Args, USER_SIZE, PRIORITY_QUEUE_LENGTH, COLLATERAL_SIZE, User, Collateral};
use solana_client::{
    rpc_client::RpcClient,
    rpc_filter::RpcFilterType,
    rpc_config::{RpcProgramAccountsConfig, RpcAccountInfoConfig},
};
use solana_account_decoder::{UiAccountEncoding};
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
use solana_sdk::account::Account;

fn main() {
    let args = Args::parse();

    // get cluster and establish connection
    let rpc_url = match args.cluster.as_str() {
        "dev" => String::from("http://api.devnet.solana.com"),
        "main" => String::from("http://api.mainnet-beta.solana.com"),
       "testnet" => String::from("http://api.testnet.solana.com"),
        _ => String::from("http://127.0.0.1:8899"),
    };
    let connection = RpcClient::new_with_commitment(rpc_url, CommitmentConfig::confirmed());

    // get signer wallet
    let wallet_path = args.sign;
    let wallet_keypair = read_keypair_file(wallet_path).expect("Can't open file-wallet");
    let wallet_pubkey = wallet_keypair.pubkey();

    loop {
        let filters = Some(vec![
            RpcFilterType::DataSize(USER_SIZE),
        ]);

        // get User accounts
        let user_accounts = get_accounts(filters, &connection);

        // deserialize user data
        let mut user_data = vec![];
        let _ = user_accounts.into_iter().map(|(address, account)| user_data.push((address, User::unpack_from_slice(account.data.as_slice()).unwrap())));

        // sort by rate
        user_data.sort_by(|(_, a), (_, b)| b.rate.cmp(&a.rate));
        user_data.reverse();

        let filters = Some(vec![
            RpcFilterType::DataSize(COLLATERAL_SIZE),
        ]);

        // get collateral accounts
        let collateral_accounts = get_accounts(filters, &connection);

        // deserialize collateral data
        let mut collateral_data = vec![];
        let _ = collateral_accounts.into_iter().map(|(address, account)| collateral_data.push((address, Collateral::unpack_from_slice(account.data.as_slice()).unwrap())));

        // find collaterals by user list and make priority queue
        let (collaterals, values) = generate_priority_queue(user_data, collateral_data);

        let oracle = args.oracle.parse::<Pubkey>().unwrap();

        // send tx to contract
        let instructions = vec![Instruction::new_with_borsh(
            Pubkey::new_from_array(ID.to_bytes()),
            &omnisol::instruction::UpdateOracleInfo {
                addresses: collaterals,
                values,
            },
            vec![
                AccountMeta::new(wallet_pubkey, true),
                AccountMeta::new(oracle, false),
                AccountMeta::new(system_program::id(), false),
            ],
        )];
        let mut tx = Transaction::new_with_payer(&instructions, Some(&wallet_pubkey));
        let recent_blockhash = connection.get_latest_blockhash().expect("Can't get blockhash");
        tx.sign(&vec![&wallet_keypair], recent_blockhash);
        connection.send_transaction(&tx).expect("Transaction failed.");
    }
}

fn get_accounts(filters: Option<Vec<RpcFilterType>>, connection: &RpcClient) -> Vec<(Pubkey, Account)> {
    connection.get_program_accounts_with_config(
        &Pubkey::new_from_array(ID.to_bytes()),
        RpcProgramAccountsConfig {
            filters,
            account_config: RpcAccountInfoConfig {
                encoding: Some(UiAccountEncoding::Base64),
                commitment: Some(connection.commitment()),
                ..RpcAccountInfoConfig::default()
            },
            ..RpcProgramAccountsConfig::default()
        },
    ).unwrap()
}

fn generate_priority_queue(user_data: Vec<(Pubkey, User)>, collateral_data: Vec<(Pubkey, Collateral)>) -> (Vec<Pubkey>, Vec<u64>) {
    let mut collaterals = vec![];
    let mut values = vec![];

    for (user_address, _) in user_data {
        if collaterals.len() > PRIORITY_QUEUE_LENGTH {
            break;
        }
        for (address, collateral) in &collateral_data {
            if collaterals.len() > PRIORITY_QUEUE_LENGTH {
                break;
            }
            if collateral.user == user_address {
                let rest_amount = collateral.delegation_stake - collateral.liquidated_amount;
                if rest_amount > 0 {
                    collaterals.push(*address);
                    values.push(rest_amount);
                }
            }
        }
    }

    (collaterals, values)
}
