use anchor_lang::prelude::*;

use crate::{
    state::{Manager, Pool},
    ErrorCode,
};

pub fn handle(ctx: Context<PausePool>) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    if !pool.is_active {
        return Err(ErrorCode::PoolAlreadyPaused.into());
    }

    pool.is_active = false;

    Ok(())
}

#[derive(Accounts)]
pub struct PausePool<'info> {
    #[account(mut, has_one = authority)]
    pub pool: Box<Account<'info, Pool>>,

    #[account(mut, seeds = [Manager::SEED, authority.key().as_ref()], bump)]
    pub manager: Box<Account<'info, Manager>>,

    #[account(mut)]
    pub authority: Signer<'info>,
}
