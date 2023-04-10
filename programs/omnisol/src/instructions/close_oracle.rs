use std::str::FromStr;

use anchor_lang::prelude::*;

use crate::state::{Oracle, ADMIN};

/// The admin can close oracle
pub fn handle(_ctx: Context<CloseOracle>) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct CloseOracle<'info> {
    #[account(
        mut,
        address = Pubkey::from_str(ADMIN).unwrap()
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [Oracle::SEED],
        bump,
        close = authority
    )]
    pub oracle: Box<Account<'info, Oracle>>,

    pub system_program: Program<'info, System>,
}
