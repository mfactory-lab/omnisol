use arrayref::{array_ref, array_refs};
use solana_account_decoder::UiAccountEncoding;
use solana_client::rpc_client::RpcClient;
use solana_client::rpc_config::{RpcAccountInfoConfig, RpcProgramAccountsConfig};
use solana_client::rpc_filter::RpcFilterType;
use solana_sdk::{program_error::ProgramError, pubkey::Pubkey};
use solana_sdk::account::Account;
use omnisol::ID;
use borsh::de::BorshDeserialize;
use omnisol::state::{Oracle, QueueMember, User, WithdrawInfo};

pub const PRIORITY_QUEUE_LENGTH: usize = 255;
pub const WITHDRAW_INFO_DISCRIMINATOR: [u8; 8] = [103, 244, 107, 42, 135, 228, 81, 107];
pub const ORACLE_DISCRIMINATOR: [u8; 8] = [139, 194, 131, 179, 140, 179, 229, 244];
pub const COLLATERAL_DISCRIMINATOR: [u8; 8] = [123, 130, 234, 63, 255, 240, 255, 92];

pub fn withdraw_info_from_slice(src: &[u8]) -> Result<WithdrawInfo, ProgramError> {
    let src = array_ref![src, 0, WithdrawInfo::SIZE];
    let (_, authority, amount, created_at) =
        array_refs![src, 8, 32, 8, 8];
    Ok(WithdrawInfo {
        authority: Pubkey::new_from_array(*authority),
        amount: u64::from_le_bytes(*amount),
        created_at: i64::from_le_bytes(*created_at),
    })
}

pub fn oracle_from_slice(src: &[u8]) -> Result<Oracle, ProgramError> {
    let src = array_ref![src, 0, Oracle::SIZE];
    let (_, authority, _, queue_members_data) =
        array_refs![src, 8, 32, 4, Oracle::SIZE - 44];

    let mut queue_members_data = queue_members_data;
    let mut queue_members = vec![];

    loop {
        let queue_member_data = array_ref![queue_members_data, 0, 40];
        let queue_member = match QueueMember::try_from_slice(queue_member_data) {
            Ok(queue_member) => queue_member,
            Err(_) => break,
        };
        queue_members.push(queue_member);
        queue_members_data = array_ref![queue_member_data, 40, Oracle::SIZE - 44];
    }

    Ok(Oracle {
        authority: Pubkey::new_from_array(*authority),
        priority_queue: queue_members,
    })
}

pub fn user_from_slice(src: &[u8]) -> Result<User, ProgramError> {
    let src = array_ref![src, 0, User::SIZE];
    let (_, wallet, rate, is_blocked, request_amount, last_withdraw_index) =
        array_refs![src, 8, 32, 8, 1, 4, 4];
    Ok(User {
        wallet: Pubkey::new_from_array(*wallet),
        rate: u64::from_le_bytes(*rate),
        is_blocked: is_blocked[0] != 0,
        requests_amount: u32::from_le_bytes(*request_amount),
        last_withdraw_index: u32::from_le_bytes(*last_withdraw_index),
    })
}

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
