use anchor_lang::prelude::*;

use crate::state::{Oracle, Pool};

pub fn handle(_ctx: Context<CloseOracle>) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct CloseOracle<'info> {
    #[account(has_one = authority)]
    pub pool: Box<Account<'info, Pool>>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut, close = authority)]
    pub oracle: Box<Account<'info, Oracle>>,

    pub system_program: Program<'info, System>,
}
