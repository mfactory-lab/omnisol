use anchor_lang::prelude::*;

use crate::{
    state::Pool,
    ErrorCode,
};

pub fn handle(ctx: Context<ClosePool>) -> Result<()> {
    if ctx.accounts.pool.collaterals_amount > 0 {
        msg!("Please, wait until all collaterals will be closed");
        return Err(ErrorCode::StillRemainingCollaterals.into());
    }

    Ok(())
}

#[derive(Accounts)]
pub struct ClosePool<'info> {
    #[account(mut, close = authority, has_one = authority)]
    pub pool: Box<Account<'info, Pool>>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}
