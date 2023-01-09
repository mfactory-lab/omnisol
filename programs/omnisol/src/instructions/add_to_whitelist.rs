use anchor_lang::prelude::*;

use crate::state::Whitelist;
use crate::state::Pool;

pub fn handle(ctx: Context<AddToWhitelist>) -> Result<()> {
    let whitelist = &mut ctx.accounts.whitelist;
    let address_to_whitelist = ctx.accounts.address_to_whitelist.key();

    whitelist.whitelisted_token = address_to_whitelist;

    Ok(())
}

#[derive(Accounts)]
pub struct AddToWhitelist<'info> {
    #[account(has_one = authority)]
    pub pool: Box<Account<'info, Pool>>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Address of LP token to whitelist it
    pub address_to_whitelist: AccountInfo<'info>,

    #[account(init,
        seeds = [
            Whitelist::SEED,
            address_to_whitelist.key().as_ref(),
        ],
        bump,
        payer = authority,
        space = Whitelist::SIZE)]
    pub whitelist: Box<Account<'info, Whitelist>>,

    pub system_program: Program<'info, System>,
}
