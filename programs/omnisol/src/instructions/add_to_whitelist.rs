use anchor_lang::prelude::*;

use crate::state::{Manager, Whitelist};

pub fn handle(ctx: Context<AddToWhitelist>) -> Result<()> {
    let whitelist = &mut ctx.accounts.whitelist;
    let address_to_whitelist = ctx.accounts.address_to_whitelist.key();

    whitelist.whitelisted_token = address_to_whitelist;

    Ok(())
}

#[derive(Accounts)]
pub struct AddToWhitelist<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Address of LP token to whitelist it
    pub address_to_whitelist: AccountInfo<'info>,

    #[account(init,
        seeds = [Whitelist::SEED, address_to_whitelist.key().as_ref()],
        bump,
        payer = authority,
        space = Whitelist::SIZE
    )]
    pub whitelist: Box<Account<'info, Whitelist>>,

    #[account(mut, seeds = [Manager::SEED, authority.key().as_ref()], bump)]
    pub manager: Box<Account<'info, Manager>>,

    pub system_program: Program<'info, System>,
}
