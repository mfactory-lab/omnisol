use anchor_lang::prelude::*;

use crate::state::Whitelist;
use crate::state::Pool;

pub fn handle(_ctx: Context<RemoveFromWhitelist>) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct RemoveFromWhitelist<'info> {
    #[account(has_one = authority)]
    pub pool: Box<Account<'info, Pool>>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut,
    seeds = [
    Whitelist::SEED,
    address_to_whitelist.key().as_ref(),
    ],
    bump,
    close = authority)]
    pub whitelist: Box<Account<'info, Whitelist>>,

    /// CHECK: Address of LP token to whitelist it
    pub address_to_whitelist: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}
