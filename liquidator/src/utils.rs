use gimli::ReaderOffset;
use omnisol::ID;
use solana_account_decoder::UiAccountEncoding;
use solana_client::{
    rpc_client::RpcClient,
    rpc_config::{RpcAccountInfoConfig, RpcProgramAccountsConfig},
    rpc_filter::RpcFilterType,
    client_error::Result,
};
use solana_client::rpc_filter::{Memcmp, MemcmpEncodedBytes};
use solana_sdk::{account::Account, pubkey::Pubkey};
use omnisol::state::{Oracle, User, WithdrawInfo};
use anchor_lang::AnchorDeserialize;

pub const WITHDRAW_INFO_DISCRIMINATOR: [u8; 8] = [103, 244, 107, 42, 135, 228, 81, 107];

pub fn get_withdraw_info_list(client: &RpcClient) -> Result<Vec<(Pubkey, WithdrawInfo)>> {
    let accounts = get_accounts(
        Some(vec![
            RpcFilterType::DataSize(WithdrawInfo::SIZE.into_u64()),
            RpcFilterType::Memcmp(Memcmp {
                offset: 0,
                bytes: MemcmpEncodedBytes::Bytes(WITHDRAW_INFO_DISCRIMINATOR.to_vec()),
                encoding: None,
            }),
        ]),
        client,
    )?;

    // get withdraw info data
    let mut withdraw_info_list: Vec<(Pubkey, WithdrawInfo)> = accounts
        .into_iter()
        .map(|(address, account)| {
            let withdraw_info = WithdrawInfo::try_from_slice(account.data.as_slice()).expect("Failed to deserialize");
            (address, withdraw_info)
        })
        .collect::<Vec<_>>();

    // sort by rate
    withdraw_info_list.sort_by(|(_, a), (_, b)| a.created_at.cmp(&b.created_at));

    Ok(withdraw_info_list)
}

pub fn get_user_data(client: &RpcClient, authority: Pubkey) -> Result<(Pubkey, User)> {
    // find user account
    let (user_account, _) = Pubkey::find_program_address(&[User::SEED, authority.as_ref()], &ID);

    // get user data
    let user_data = client.get_account_data(&user_account)?;

    // deserialize user data
    let user_data: User = User::try_from_slice(user_data.as_slice()).expect("Failed to deserialize");

    Ok((user_account, user_data))
}

pub fn get_oracle_data(client: &RpcClient, oracle: &Pubkey) -> Result<Oracle> {
    // get oracle data
    let oracle_data = client.get_account_data(oracle)?;

    // deserialize oracle data
    let oracle_data = Oracle::try_from_slice(oracle_data.as_slice()).expect("Failed to deserialize");

    Ok(oracle_data)
}

pub fn get_accounts(filters: Option<Vec<RpcFilterType>>, connection: &RpcClient) -> Result<Vec<(Pubkey, Account)>> {
    connection
        .get_program_accounts_with_config(
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
        )
}
