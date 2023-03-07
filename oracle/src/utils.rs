use anchor_lang::prelude::borsh::BorshDeserialize;
use arrayref::{array_ref, array_refs};
use gimli::ReaderOffset;
use omnisol::{
    state::{Collateral, User},
    ID,
};
use solana_account_decoder::UiAccountEncoding;
use solana_client::{
    client_error::Result,
    rpc_client::RpcClient,
    rpc_config::{RpcAccountInfoConfig, RpcProgramAccountsConfig},
    rpc_filter::{Memcmp, MemcmpEncodedBytes, RpcFilterType},
};
use solana_sdk::{account::Account, pubkey::Pubkey};

pub const PRIORITY_QUEUE_LENGTH: usize = 255;
pub const USER_DISCRIMINATOR: [u8; 8] = [159, 117, 95, 227, 239, 151, 58, 236];
pub const COLLATERAL_DISCRIMINATOR: [u8; 8] = [123, 130, 234, 63, 255, 240, 255, 92];

pub fn get_accounts(filters: Option<Vec<RpcFilterType>>, client: &RpcClient) -> Result<Vec<(Pubkey, Account)>> {
    client.get_program_accounts_with_config(
        &Pubkey::new_from_array(ID.to_bytes()),
        RpcProgramAccountsConfig {
            filters,
            account_config: RpcAccountInfoConfig {
                encoding: Some(UiAccountEncoding::Base64),
                commitment: Some(client.commitment()),
                ..RpcAccountInfoConfig::default()
            },
            ..RpcProgramAccountsConfig::default()
        },
    )
}

pub fn get_user_data(client: &RpcClient) -> Result<Vec<(Pubkey, User)>> {
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
    )?;

    let mut user_data: Vec<(Pubkey, User)> = accounts
        .into_iter()
        .map(|(address, account)| {
            let src = array_ref![account.data, 0, User::SIZE];
            let (_, wallet, rate, is_blocked, request_amount, last_withdraw_index) =
                array_refs![src, 8, 32, 8, 1, 4, 4];
            let user = User {
                wallet: Pubkey::new_from_array(*wallet),
                rate: u64::from_le_bytes(*rate),
                is_blocked: is_blocked[0] != 0,
                requests_amount: u32::from_le_bytes(*request_amount),
                last_withdraw_index: u32::from_le_bytes(*last_withdraw_index),
            };
            (address, user)
        })
        .collect::<Vec<_>>();

    // sort by rate
    user_data.sort_by(|(_, a), (_, b)| a.rate.cmp(&b.rate));

    Ok(user_data)
}

pub fn get_collateral_data(client: &RpcClient) -> Result<Vec<(Pubkey, Collateral)>> {
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
    )?;

    let collateral_data = accounts
        .into_iter()
        .map(|(address, account)| {
            let src = array_ref![account.data, 0, Collateral::SIZE];
            let (_, user, pool, source_stake, delegated_stake, delegation_stake, amount, liquidated_amount, created_at, bump, is_native) =
                array_refs![src, 8, 32, 32, 32, 32, 8, 8, 8, 8, 1, 1];
            let collateral = Collateral {
                user: Pubkey::new_from_array(*user),
                pool: Pubkey::new_from_array(*pool),
                source_stake: Pubkey::new_from_array(*source_stake),
                delegated_stake:Pubkey::new_from_array(*delegated_stake),
                delegation_stake: u64::from_le_bytes(*delegation_stake),
                amount: u64::from_le_bytes(*amount),
                liquidated_amount: u64::from_le_bytes(*liquidated_amount),
                created_at: i64::from_le_bytes(*created_at),
                bump: u8::from_le_bytes(*bump),
                is_native: is_native[0] != 0,
            };
            (address, collateral)
        })
        .collect::<Vec<_>>();

    Ok(collateral_data)
}

pub fn generate_priority_queue(
    user_data: Vec<(Pubkey, User)>,
    collateral_data: Vec<(Pubkey, Collateral)>,
) -> (Vec<Pubkey>, Vec<u64>) {
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_priority_queue() {
        let pubkey_1 = Pubkey::new_unique();
        let user_1 = User {
            wallet: Default::default(),
            rate: 0,
            is_blocked: false,
            requests_amount: 0,
            last_withdraw_index: 0,
        };
        let pubkey_2 = Pubkey::new_unique();
        let user_2 = User {
            wallet: Default::default(),
            rate: 100,
            is_blocked: false,
            requests_amount: 0,
            last_withdraw_index: 0,
        };
        let pubkey_3 = Pubkey::new_unique();
        let user_3 = User {
            wallet: Default::default(),
            rate: 200,
            is_blocked: false,
            requests_amount: 0,
            last_withdraw_index: 0,
        };
        let collateral_address_1 = Pubkey::new_unique();
        let collateral_address_2 = Pubkey::new_unique();
        let collateral_address_3 = Pubkey::new_unique();
        let collateral_address_4 = Pubkey::new_unique();
        let collateral_address_5 = Pubkey::new_unique();
        let collateral_1 = Collateral {
            user: pubkey_1,
            pool: Default::default(),
            source_stake: Default::default(),
            delegation_stake: 100,
            amount: 0,
            liquidated_amount: 100,
            created_at: 0,
            bump: 0,
            is_native: false,
        };
        let collateral_2 = Collateral {
            user: pubkey_1,
            pool: Default::default(),
            source_stake: Default::default(),
            delegation_stake: 100,
            amount: 0,
            liquidated_amount: 0,
            created_at: 0,
            bump: 0,
            is_native: false,
        };
        let collateral_3 = Collateral {
            user: pubkey_2,
            pool: Default::default(),
            source_stake: Default::default(),
            delegation_stake: 100,
            amount: 0,
            liquidated_amount: 50,
            created_at: 0,
            bump: 0,
            is_native: false,
        };
        let collateral_4 = Collateral {
            user: pubkey_3,
            pool: Default::default(),
            source_stake: Default::default(),
            delegation_stake: 100,
            amount: 0,
            liquidated_amount: 0,
            created_at: 0,
            bump: 0,
            is_native: false,
        };
        let collateral_5 = Collateral {
            user: pubkey_3,
            pool: Default::default(),
            source_stake: Default::default(),
            delegation_stake: 100,
            amount: 0,
            liquidated_amount: 99,
            created_at: 0,
            bump: 0,
            is_native: false,
        };
        let user_data = vec![(pubkey_1, user_1), (pubkey_2, user_2), (pubkey_3, user_3)];
        let collateral_data = vec![
            (collateral_address_1, collateral_1),
            (collateral_address_2, collateral_2),
            (collateral_address_3, collateral_3),
            (collateral_address_4, collateral_4),
            (collateral_address_5, collateral_5),
        ];
        let result_1 = vec![
            collateral_address_2,
            collateral_address_3,
            collateral_address_4,
            collateral_address_5,
        ];
        let result_2 = vec![100, 50, 100, 1];
        assert_eq!(
            generate_priority_queue(user_data, collateral_data),
            (result_1, result_2)
        );
    }
}
