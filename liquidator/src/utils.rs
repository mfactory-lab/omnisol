use std::collections::HashMap;
use anchor_client::{
    solana_client::rpc_filter::{Memcmp, MemcmpEncodedBytes, RpcFilterType},
    solana_sdk::pubkey::Pubkey,
    ClientError, Program,
};
use gimli::ReaderOffset;
use omnisol::{
    state::{Oracle, User, WithdrawInfo},
};
use omnisol::state::{Collateral, Pool};

pub const WITHDRAW_INFO_DISCRIMINATOR: [u8; 8] = [103, 244, 107, 42, 135, 228, 81, 107];
pub const USER_DISCRIMINATOR: [u8; 8] = [159, 117, 95, 227, 239, 151, 58, 236];
pub const COLLATERAL_DISCRIMINATOR: [u8; 8] = [123, 130, 234, 63, 255, 240, 255, 92];
pub const POOL_DISCRIMINATOR: [u8; 8] = [241, 154, 109, 4, 17, 177, 109, 188];

pub fn get_withdraw_info_list(program: &Program) -> Result<Vec<(Pubkey, WithdrawInfo)>, ClientError> {
    let filters = vec![
        RpcFilterType::DataSize(WithdrawInfo::SIZE.into_u64()),
        RpcFilterType::Memcmp(Memcmp {
            offset: 0,
            bytes: MemcmpEncodedBytes::Bytes(WITHDRAW_INFO_DISCRIMINATOR.to_vec()),
            encoding: None,
        }),
    ];

    let mut accounts = program.accounts::<WithdrawInfo>(filters)?;

    // sort by rate
    accounts.sort_by(|(_, a), (_, b)| a.created_at.cmp(&b.created_at));

    Ok(accounts)
}

pub fn get_user_data(program: &Program) -> Result<HashMap<Pubkey, User>, ClientError> {
    let filters = vec![
        RpcFilterType::DataSize(User::SIZE.into_u64()),
        RpcFilterType::Memcmp(Memcmp {
            offset: 0,
            bytes: MemcmpEncodedBytes::Bytes(USER_DISCRIMINATOR.to_vec()),
            encoding: None,
        }),
    ];

    let accounts = program.accounts::<User>(filters)?;

    let map = accounts.into_iter().collect::<HashMap<_, _>>();

    Ok(map)
}

pub fn get_collateral_data(program: &Program) -> Result<HashMap<Pubkey, Collateral>, ClientError> {
    let filters = vec![
        RpcFilterType::DataSize(Collateral::SIZE.into_u64()),
        RpcFilterType::Memcmp(Memcmp {
            offset: 0,
            bytes: MemcmpEncodedBytes::Bytes(COLLATERAL_DISCRIMINATOR.to_vec()),
            encoding: None,
        }),
    ];

    let accounts = program.accounts::<Collateral>(filters)?;

    let map = accounts.into_iter().collect::<HashMap<_, _>>();

    Ok(map)
}

pub fn get_pool_data(program: &Program) -> Result<HashMap<Pubkey, Pool>, ClientError> {
    let filters = vec![
        RpcFilterType::DataSize(Pool::SIZE.into_u64()),
        RpcFilterType::Memcmp(Memcmp {
            offset: 0,
            bytes: MemcmpEncodedBytes::Bytes(POOL_DISCRIMINATOR.to_vec()),
            encoding: None,
        }),
    ];

    let accounts = program.accounts::<Pool>(filters)?;

    let map = accounts.into_iter().collect::<HashMap<_, _>>();

    Ok(map)
}

pub fn get_oracle_data(program: &Program, oracle: Pubkey) -> Result<Oracle, ClientError> {
    // get oracle data
    let oracle_data = program.account::<Oracle>(oracle)?;

    Ok(oracle_data)
}
