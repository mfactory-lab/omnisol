use solana_account_decoder::UiAccountEncoding;
use solana_client::rpc_client::RpcClient;
use solana_client::rpc_config::{RpcAccountInfoConfig, RpcProgramAccountsConfig};
use solana_client::rpc_filter::RpcFilterType;
use solana_sdk::pubkey::Pubkey;
use solana_sdk::account::Account;
use omnisol::ID;

pub const WITHDRAW_INFO_DISCRIMINATOR: [u8; 8] = [103, 244, 107, 42, 135, 228, 81, 107];

pub fn get_accounts(filters: Option<Vec<RpcFilterType>>, connection: &RpcClient) -> Vec<(Pubkey, Account)> {
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
