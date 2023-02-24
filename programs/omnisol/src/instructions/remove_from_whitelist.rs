use anchor_lang::prelude::*;

use crate::state::{Manager, Whitelist};

pub fn handle(_ctx: Context<RemoveFromWhitelist>) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct RemoveFromWhitelist<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [
            Whitelist::SEED,
            address_to_whitelist.key().as_ref(),
        ],
        bump,
        close = authority
    )]
    pub whitelist: Box<Account<'info, Whitelist>>,

    #[account(
        mut,
        seeds = [
            Manager::SEED,
            authority.key().as_ref(),
        ],
        bump,
    )]
    pub manager: Box<Account<'info, Manager>>,

    /// CHECK: Address of LP token to whitelist it
    pub address_to_whitelist: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}
