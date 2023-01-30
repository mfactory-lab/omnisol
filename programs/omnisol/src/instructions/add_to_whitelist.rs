use anchor_lang::prelude::*;
use spl_stake_pool::state::StakePool;

use crate::state::{Manager, Whitelist};
use crate::ErrorCode;

pub fn handle(ctx: Context<AddToWhitelist>) -> Result<()> {
    let whitelist = &mut ctx.accounts.whitelist;
    let address_to_whitelist = ctx.accounts.address_to_whitelist.key();
    let pool = ctx.accounts.pool.key();
    let staking_pool = ctx.accounts.staking_pool.key();

    // let mut stake_pool_data = &mut &**ctx.accounts.staking_pool.try_borrow_data()?;
    // let stake_pool = StakePool::deserialize(stake_pool_data)?;
    //
    // if stake_pool.pool_mint != ctx.accounts.address_to_whitelist.key() {
    //     return Err(ErrorCode::WrongData.into());
    // }

    whitelist.whitelisted_token = address_to_whitelist;
    whitelist.pool = pool;
    whitelist.staking_pool = staking_pool;

    Ok(())
}

#[derive(Accounts)]
pub struct AddToWhitelist<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Address of LP token to whitelist it
    pub address_to_whitelist: AccountInfo<'info>,

    /// CHECK: Address of LP token's global pool
    pub pool: AccountInfo<'info>,

    /// CHECK: Stake pool with LP token mint address
    pub staking_pool: AccountInfo<'info>,

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
