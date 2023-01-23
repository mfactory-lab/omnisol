use anchor_lang::prelude::*;

use crate::{state::Pool, ErrorCode};
use crate::state::Oracle;

pub fn handle(ctx: Context<InitOracle>) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle;

    oracle.authority = ctx.accounts.oracle_authority.key();

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
