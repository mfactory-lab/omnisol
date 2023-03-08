use std::collections::HashMap;

use anchor_client::{solana_sdk::pubkey::Pubkey, ClientError, Program};
use gimli::ReaderOffset;
use omnisol::state::{Collateral, User};
use solana_client::rpc_filter::{Memcmp, MemcmpEncodedBytes, RpcFilterType};

pub const PRIORITY_QUEUE_LENGTH: usize = 255;
pub const USER_DISCRIMINATOR: [u8; 8] = [159, 117, 95, 227, 239, 151, 58, 236];
pub const COLLATERAL_DISCRIMINATOR: [u8; 8] = [123, 130, 234, 63, 255, 240, 255, 92];

pub fn get_user_data(program: &Program) -> Result<Vec<(Pubkey, User)>, ClientError> {
    let filters = vec![
        RpcFilterType::DataSize(User::SIZE.into_u64()),
        RpcFilterType::Memcmp(Memcmp {
            offset: 0,
            bytes: MemcmpEncodedBytes::Bytes(USER_DISCRIMINATOR.to_vec()),
            encoding: None,
        }),
    ];

    let mut accounts = program.accounts::<User>(filters)?;

    // sort by rate
    accounts.sort_by(|(_, a), (_, b)| a.rate.cmp(&b.rate));

    Ok(accounts)
}

pub fn get_collateral_data(program: &Program) -> Result<Vec<(Pubkey, Collateral)>, ClientError> {
    let filters = vec![
        RpcFilterType::DataSize(Collateral::SIZE.into_u64()),
        RpcFilterType::Memcmp(Memcmp {
            offset: 0,
            bytes: MemcmpEncodedBytes::Bytes(COLLATERAL_DISCRIMINATOR.to_vec()),
            encoding: None,
        }),
    ];

    let accounts = program.accounts::<Collateral>(filters)?;

    Ok(accounts)
}

pub fn generate_priority_queue(
    user_data: Vec<(Pubkey, User)>,
    collateral_data: Vec<(Pubkey, Collateral)>,
) -> HashMap<Pubkey, u64> {
    let mut map = HashMap::new();

    'outer: for (user_address, _) in user_data {
        for (address, collateral) in &collateral_data {
            if map.len() > PRIORITY_QUEUE_LENGTH {
                break 'outer;
            }
            if collateral.user == user_address {
                let rest_amount = collateral.delegation_stake - collateral.liquidated_amount;
                if rest_amount > 0 {
                    map.insert(*address, rest_amount);
                }
            }
        }
    }

    map
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
            delegated_stake: Default::default(),
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
            delegated_stake: Default::default(),
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
            delegated_stake: Default::default(),
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
            delegated_stake: Default::default(),
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
            delegated_stake: Default::default(),
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
        let mut result = HashMap::new();
        result.insert(collateral_address_2, 100);
        result.insert(collateral_address_3, 50);
        result.insert(collateral_address_4, 100);
        result.insert(collateral_address_5, 1);

        assert_eq!(generate_priority_queue(user_data, collateral_data), result);
    }
}
