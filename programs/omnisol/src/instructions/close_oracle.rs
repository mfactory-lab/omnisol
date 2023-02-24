use std::str::FromStr;

use anchor_lang::prelude::*;

use crate::state::{Oracle, ADMIN};

pub fn handle(_ctx: Context<CloseOracle>) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct CloseOracle<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        constraint = authority.key() == Pubkey::from_str(ADMIN).unwrap(),
        close = authority)
    ]
    pub oracle: Box<Account<'info, Oracle>>,

    pub system_program: Program<'info, System>,
}
