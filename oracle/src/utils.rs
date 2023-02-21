use arrayref::{array_ref, array_refs};
use solana_account_decoder::UiAccountEncoding;
use solana_client::rpc_client::RpcClient;
use solana_client::rpc_config::{RpcAccountInfoConfig, RpcProgramAccountsConfig};
use solana_client::rpc_filter::RpcFilterType;
use solana_sdk::{program_error::ProgramError, pubkey::Pubkey};
use solana_sdk::account::Account;
use omnisol::ID;

pub const PRIORITY_QUEUE_LENGTH: usize = 255;
pub const USER_DISCRIMINATOR: [u8; 8] = [159, 117, 95, 227, 239, 151, 58, 236];
pub const COLLATERAL_DISCRIMINATOR: [u8; 8] = [123, 130, 234, 63, 255, 240, 255, 92];

pub struct User {
    pub rate: u64,
}

impl User {
    pub fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        let src = array_ref![src, 0, omnisol::state::User::SIZE];
        let (_, _, rate, _, _, _) =
            array_refs![src, 8, 32, 8, 1, 4, 4];
        Ok(User {
            rate: u64::from_le_bytes(*rate),
        })
    }
}

pub struct Collateral {
    pub user: Pubkey,
    pub delegation_stake: u64,
    pub liquidated_amount: u64,
}

impl Collateral {
    pub fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        let src = array_ref![src, 0, omnisol::state::Collateral::SIZE];
        let (_, user, _, _, delegation_stake, _, liquidated_amount, _, _, _) =
            array_refs![src, 8, 32, 32, 32, 8, 8, 8, 8, 1, 1];
        Ok(Collateral {
            user: Pubkey::new_from_array(*user),
            delegation_stake: u64::from_le_bytes(*delegation_stake),
            liquidated_amount: u64::from_le_bytes(*liquidated_amount),
        })
    }
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

pub fn generate_priority_queue(user_data: Vec<(Pubkey, User)>, collateral_data: Vec<(Pubkey, Collateral)>) -> (Vec<Pubkey>, Vec<u64>) {
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
