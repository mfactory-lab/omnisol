use anchor_lang::prelude::*;
use anchor_spl::token;

use crate::{
    events::*,
    state::{Collateral, Pool, User},
    ErrorCode,
};
use crate::state::MINT_AUTHORITY_SEED;

/// The user can use their deposit to mint omniSOL.
/// They can now withdraw this omniSOL and do whatever they want with it e.g. sell it, participate in DeFi, etc.
pub fn handle(ctx: Context<MintOmnisol>, amount: u64) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    if !pool.is_active {
        return Err(ErrorCode::PoolAlreadyPaused.into());
    }

    let user = &mut ctx.accounts.user;
    if user.is_blocked {
        return Err(ErrorCode::UserBlocked.into());
    }

    let collateral = &mut ctx.accounts.collateral;

    if amount > collateral.delegation_stake - collateral.amount {
        return Err(ErrorCode::InsufficientAmount.into());
    }

    let pool_key = pool.key();
    let mint_authority_seeds = [MINT_AUTHORITY_SEED, &[ctx.bumps["mint_authority"]]];
    let clock = &ctx.accounts.clock;

    // Mint new pool tokens equals to `amount`
    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                mint: ctx.accounts.pool_mint.to_account_info(),
                to: ctx.accounts.user_pool_token.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
            },
            &[&mint_authority_seeds],
        ),
        amount,
    )?;

    collateral.amount += amount;
    user.rate -= amount;

    emit!(MintOmnisolEvent {
        pool: pool.key(),
        user: user.key(),
        collateral: collateral.key(),
        timestamp: clock.unix_timestamp,
        amount,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct MintOmnisol<'info> {
    #[account(mut, address = collateral.pool)]
    pub pool: Box<Account<'info, Pool>>,

    /// CHECK:
    #[account(mut, address = pool.pool_mint)]
    pub pool_mint: AccountInfo<'info>,

    /// CHECK: no needs to check, only for signing
    #[account(seeds = [MINT_AUTHORITY_SEED], bump)]
    pub mint_authority: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [User::SEED, authority.key().as_ref()],
        bump,
    )]
    pub user: Box<Account<'info, User>>,

    #[account(
        mut,
        seeds = [Collateral::SEED, user.key().as_ref(), staked_address.key().as_ref()],
        bump,
    )]
    pub collateral: Box<Account<'info, Collateral>>,

    #[account(
        mut,
        associated_token::mint = pool_mint,
        associated_token::authority = authority,
    )]
    pub user_pool_token: Account<'info, token::TokenAccount>,

    /// CHECK: only need for seeds
    pub staked_address: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub clock: Sysvar<'info, Clock>,
    pub token_program: Program<'info, token::Token>,
}
