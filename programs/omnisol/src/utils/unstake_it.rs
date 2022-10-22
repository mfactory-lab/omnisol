use std::str::FromStr;

use anchor_lang::{
    prelude::*,
    solana_program::{account_info::AccountInfo, instruction::Instruction, program::invoke_signed},
};

use crate::{AccountMeta, Accounts, Pubkey};

/// unstake.it program address
const PROGRAM_ADDRESS: &str = "unpXTU2Ndrc7WWNyEhQWe4udTzSibLPi25SXv2xbCHQ";

pub fn unstake<'info>(ctx: CpiContext<'_, '_, '_, 'info, Unstake<'info>>) -> Result<()> {
    let account_metas = vec![
        AccountMeta::new(ctx.accounts.payer.key(), true),
        AccountMeta::new_readonly(ctx.accounts.unstaker.key(), true),
        AccountMeta::new(ctx.accounts.stake_account.key(), false),
        AccountMeta::new(ctx.accounts.destination.key(), false),
        AccountMeta::new(ctx.accounts.pool_account.key(), false),
        AccountMeta::new(ctx.accounts.pool_sol_reserves.key(), false),
        AccountMeta::new_readonly(ctx.accounts.fee_account.key(), false),
        AccountMeta::new(ctx.accounts.stake_account_record_account.key(), false),
        AccountMeta::new_readonly(ctx.accounts.protocol_fee_account.key(), false),
        AccountMeta::new(ctx.accounts.protocol_fee_destination.key(), false),
        AccountMeta::new_readonly(ctx.accounts.clock.key(), false),
        AccountMeta::new_readonly(ctx.accounts.stake_program.key(), false),
        AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
    ];

    let program_id = Pubkey::from_str(PROGRAM_ADDRESS).map_err(Into::into)?;
    let ix = Instruction::new_with_bincode(program_id, &[9], account_metas);

    let mut account_infos = vec![
        ctx.accounts.payer,
        ctx.accounts.unstaker,
        ctx.accounts.stake_account,
        ctx.accounts.destination,
        ctx.accounts.pool_account,
        ctx.accounts.pool_sol_reserves,
        ctx.accounts.fee_account,
        ctx.accounts.stake_account_record_account,
        ctx.accounts.protocol_fee_account,
        ctx.accounts.protocol_fee_destination,
        ctx.accounts.clock,
        ctx.accounts.stake_program,
        ctx.accounts.system_program,
    ];
    invoke_signed(&ix, &account_infos, ctx.signer_seeds).map_err(Into::into)
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    pub payer: AccountInfo<'info>,
    pub unstaker: AccountInfo<'info>,
    pub stake_account: AccountInfo<'info>,
    pub destination: AccountInfo<'info>,
    pub pool_account: AccountInfo<'info>,
    pub pool_sol_reserves: AccountInfo<'info>,
    pub fee_account: AccountInfo<'info>,
    pub stake_account_record_account: AccountInfo<'info>,
    pub protocol_fee_account: AccountInfo<'info>,
    pub protocol_fee_destination: AccountInfo<'info>,
    pub clock: AccountInfo<'info>,
    pub stake_program: AccountInfo<'info>,
    pub system_program: AccountInfo<'info>,
}
