use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::{
    state::{Pool, Manager},
    ErrorCode,
};

pub fn handle(ctx: Context<WithdrawSol>, amount: u64) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    let pool_key = pool.key();
    let pool_authority_seeds = [pool_key.as_ref(), &[pool.authority_bump]];

    if amount == 0 || ctx.accounts.pool_authority.lamports() < amount {
        msg!("Invalid amount");
        return Err(ErrorCode::InsufficientAmount.into());
    }

    system_program::transfer(CpiContext::new_with_signer(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
            from: ctx.accounts.pool_authority.to_account_info(),
            to: ctx.accounts.destination.to_account_info(),
        },
        &[&pool_authority_seeds],
    ),
    amount,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawSol<'info> {
    #[account(mut)]
    pub pool: Box<Account<'info, Pool>>,

    /// CHECK: no needs to check, only for signing
    #[account(mut, seeds = [pool.key().as_ref()], bump)]
    pub pool_authority: AccountInfo<'info>,

    /// CHECK: wallet for transfer
    #[account(mut)]
    pub destination: AccountInfo<'info>,

    #[account(mut, seeds = [Manager::SEED, authority.key().as_ref()], bump)]
    pub manager: Box<Account<'info, Manager>>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}
