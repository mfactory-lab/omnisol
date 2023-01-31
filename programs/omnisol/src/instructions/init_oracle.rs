use anchor_lang::prelude::*;

use crate::state::Pool;
use crate::state::Oracle;

pub fn handle(ctx: Context<InitOracle>) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle;
    let pool = &mut ctx.accounts.pool;

    oracle.authority = ctx.accounts.oracle_authority.key();
    pool.oracle = oracle.key();

    Ok(())
}

#[derive(Accounts)]
pub struct InitOracle<'info> {
    #[account(has_one = authority)]
    pub pool: Box<Account<'info, Pool>>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(init, payer = authority, space = Oracle::SIZE)]
    pub oracle: Box<Account<'info, Oracle>>,

    /// CHECK: Address of oracle manager to init
    pub oracle_authority: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}
