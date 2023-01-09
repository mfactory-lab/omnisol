use anchor_lang::prelude::*;

use crate::{state::Pool, ErrorCode};

pub fn handle(ctx: Context<ResumePool>) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    if pool.is_active {
        return Err(ErrorCode::PoolAlreadyResumed.into());
    }

    pool.is_active = true;

    Ok(())
}

#[derive(Accounts)]
pub struct ResumePool<'info> {
    #[account(mut, has_one = authority)]
    pub pool: Box<Account<'info, Pool>>,

    #[account(mut)]
    pub authority: Signer<'info>,
}
