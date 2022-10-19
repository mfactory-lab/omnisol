use anchor_lang::prelude::*;

use crate::state::Pool;

pub fn handle(_ctx: Context<ClosePool>) -> Result<()> {
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
