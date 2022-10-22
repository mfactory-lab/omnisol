use anchor_lang::prelude::*;
use anchor_spl::token;

use crate::{state::Pool, ErrorCode};

pub fn handle(ctx: Context<InitPool>) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    let pool_authority = ctx.accounts.pool_authority.key;
    let mint = &ctx.accounts.pool_mint;

    if mint.mint_authority.is_none() || mint.mint_authority.unwrap() != *pool_authority {
        msg!("Invalid pool mint authority");
        return Err(ErrorCode::Unauthorized.into());
    }

    pool.authority = ctx.accounts.authority.key();
    pool.pool_mint = ctx.accounts.pool_mint.key();
    pool.authority_bump = ctx.bumps["pool_authority"];
    pool.deposit_amount = 0;

    Ok(())
}

#[derive(Accounts)]
pub struct InitPool<'info> {
    #[account(init, payer = authority, space = Pool::SIZE)]
    pub pool: Box<Account<'info, Pool>>,

    #[account(mut)]
    pub pool_mint: Account<'info, token::Mint>,

    /// CHECK:
    #[account(seeds = [pool.key().as_ref()], bump)]
    pub pool_authority: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}
