use anchor_lang::{
    prelude::*,
    solana_program::{account_info::AccountInfo, instruction::Instruction, program::invoke_signed},
};

use crate::{AccountMeta, Accounts, Pubkey};

const UNSTAKE_IX_DISCM: [u8; 8] = [90, 95, 107, 42, 205, 124, 50, 225];

pub fn unstake<'info>(ctx: CpiContext<'_, '_, '_, 'info, Unstake<'info>>, program_id: Pubkey) -> Result<()> {
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

    let ix = Instruction::new_with_bincode(program_id, &UNSTAKE_IX_DISCM, account_metas);

    let account_infos = vec![
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
    /// CHECK:
    pub payer: AccountInfo<'info>,
    /// CHECK:
    pub unstaker: AccountInfo<'info>,
    /// CHECK:
    pub stake_account: AccountInfo<'info>,
    /// CHECK:
    pub destination: AccountInfo<'info>,
    /// CHECK:
    pub pool_account: AccountInfo<'info>,
    /// CHECK:
    pub pool_sol_reserves: AccountInfo<'info>,
    /// CHECK:
    pub fee_account: AccountInfo<'info>,
    /// CHECK:
    pub stake_account_record_account: AccountInfo<'info>,
    /// CHECK:
    pub protocol_fee_account: AccountInfo<'info>,
    /// CHECK:
    pub protocol_fee_destination: AccountInfo<'info>,
    /// CHECK:
    pub clock: AccountInfo<'info>,
    /// CHECK:
    pub stake_program: AccountInfo<'info>,
    /// CHECK:
    pub system_program: AccountInfo<'info>,
}
