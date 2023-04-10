use std::str::FromStr;

use anchor_lang::prelude::*;

use crate::state::{Oracle, ADMIN};

/// The admin can init oracle.
pub fn handle(ctx: Context<InitOracle>) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle;

    oracle.authority = ctx.accounts.oracle_authority.key();

    Ok(())
}

#[derive(Accounts)]
pub struct InitOracle<'info> {
    #[account(
        mut,
        address = Pubkey::from_str(ADMIN).unwrap()
    )]
    pub authority: Signer<'info>,

    #[account(
        init,
        seeds = [Oracle::SEED],
        bump,
        payer = authority,
        space = Oracle::SIZE
    )]
    pub oracle: Box<Account<'info, Oracle>>,

    /// CHECK: Address of oracle manager to createPool
    pub oracle_authority: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}
