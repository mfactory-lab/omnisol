use std::str::FromStr;

use anchor_lang::prelude::*;

use crate::state::{Oracle, ADMIN};

pub fn handle(ctx: Context<InitOracle>) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle;

    oracle.authority = ctx.accounts.oracle_authority.key();

    Ok(())
}

#[derive(Accounts)]
pub struct InitOracle<'info> {
    #[account(mut, constraint = authority.key() == Pubkey::from_str(ADMIN).unwrap())]
    pub authority: Signer<'info>,

    #[account(init, payer = authority, space = Oracle::SIZE)]
    pub oracle: Box<Account<'info, Oracle>>,

    /// CHECK: Address of oracle manager to init
    pub oracle_authority: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}
