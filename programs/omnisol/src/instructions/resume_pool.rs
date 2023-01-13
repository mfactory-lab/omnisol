use anchor_lang::prelude::*;

use crate::{state::Pool, ErrorCode};
use crate::state::Manager;

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
    #[account(mut)]
    pub pool: Box<Account<'info, Pool>>,

    #[account(mut,
    seeds = [
    Manager::SEED,
    authority.key().as_ref(),
    ],
    bump,)]
    pub manager: Box<Account<'info, Manager>>,

    #[account(mut)]
    pub authority: Signer<'info>,
}
