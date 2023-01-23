use anchor_lang::prelude::*;
use anchor_spl::token;

use crate::{
    events::*,
    state::{Collateral, Pool, User},
    utils, ErrorCode,
};

/// The user can use their deposit as collateral and mint omniSOL.
/// They can now withdraw this omniSOL and do whatever they want with it e.g. sell it, participate in DeFi, etc.
pub fn handle(ctx: Context<WithdrawLPTokens>, amount: u64) -> Result<()> {
    let collateral = &mut ctx.accounts.collateral;

    let rest_amount = collateral.delegation_stake - collateral.amount;

    if amount == 0 || amount > rest_amount {
        return Err(ErrorCode::InsufficientAmount.into());
    }

    let pool = &mut ctx.accounts.pool;
    if !pool.is_active {
        return Err(ErrorCode::PoolAlreadyPaused.into());
    }

    let user = &mut ctx.accounts.user;
    if user.is_blocked {
        return Err(ErrorCode::UserBlocked.into());
    }

    let pool_key = pool.key();
    let pool_authority_seeds = [pool_key.as_ref(), &[pool.authority_bump]];
    let clock = &ctx.accounts.clock;

    // Transfer LP tokens to the user
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.source.to_account_info(),
                to: ctx.accounts.destination.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
            },
            &[&pool_authority_seeds],
        ),
        amount,
    )?;

    collateral.amount -= amount;
    collateral.delegation_stake -= amount;

    pool.deposit_amount = pool
        .deposit_amount
        .checked_sub(amount)
        .ok_or(ErrorCode::InsufficientAmount)?;

    token::burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Burn {
                mint: ctx.accounts.pool_mint.to_account_info(),
                from: ctx.accounts.user_pool_token.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        amount,
    )?;

    if collateral.delegation_stake == 0 {
        // close the collateral account
        utils::close(collateral.to_account_info(), ctx.accounts.authority.to_account_info())?;
    }

    emit!(WithdrawStakeEvent {
        pool: pool.key(),
        collateral: collateral.key(),
        amount,
        rest_amount: collateral.delegation_stake,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawLPTokens<'info> {
    #[account(mut)]
    pub pool: Box<Account<'info, Pool>>,

    /// CHECK: no needs to check, only for signing
    #[account(seeds = [pool.key().as_ref()], bump = pool.authority_bump)]
    pub pool_authority: AccountInfo<'info>,

    #[account(
    mut,
    seeds = [User::SEED, authority.key().as_ref()],
    bump,
    )]
    pub user: Box<Account<'info, User>>,

    #[account(
    mut,
    seeds = [Collateral::SEED, user.key().as_ref(), lp_token.key().as_ref()],
    bump,
    )]
    pub collateral: Account<'info, Collateral>,

    #[account(
    mut,
    associated_token::mint = lp_token,
    associated_token::authority = pool_authority,
    )]
    pub source: Account<'info, token::TokenAccount>,

    #[account(
    mut,
    associated_token::mint = lp_token,
    associated_token::authority = authority,
    )]
    pub destination: Account<'info, token::TokenAccount>,

    /// CHECK: Address of a token
    pub lp_token: AccountInfo<'info>,

    /// CHECK:
    #[account(mut, address = pool.pool_mint)]
    pub pool_mint: AccountInfo<'info>,

    #[account(
    mut,
    associated_token::mint = pool_mint,
    associated_token::authority = authority,
    )]
    pub user_pool_token: Account<'info, token::TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub clock: Sysvar<'info, Clock>,
    pub token_program: Program<'info, token::Token>,
}
