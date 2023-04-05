use anchor_lang::prelude::*;

use crate::state::{Manager, Whitelist};

pub fn handle(ctx: Context<AddToTokenWhitelist>) -> Result<()> {
    let whitelist = &mut ctx.accounts.whitelist;
    let address_to_whitelist = ctx.accounts.address_to_whitelist.key();
    // program_id
    let pool = ctx.accounts.pool.key();
    let staking_pool = ctx.accounts.staking_pool.key();

    // TODO add validation

    whitelist.mint = address_to_whitelist;
    whitelist.pool = pool;
    whitelist.pool_program = staking_pool;

    Ok(())
}

#[derive(Accounts)]
pub struct AddToTokenWhitelist<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Address of LP token to whitelist it
    pub address_to_whitelist: AccountInfo<'info>,

    /// CHECK: Address of LP token's global pool
    pub pool: AccountInfo<'info>,

    /// CHECK: Stake pool with LP token mint address
    pub staking_pool: AccountInfo<'info>,

    #[account(
        init,
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
