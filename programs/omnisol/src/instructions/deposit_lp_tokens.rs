use anchor_lang::prelude::*;
use anchor_spl::token;

use crate::{
    events::*,
    state::{Collateral, Pool},
    ErrorCode,
};
use crate::state::{User, Whitelist};

/// The user can use their deposit as collateral and mint omniSOL.
/// They can now withdraw this omniSOL and do whatever they want with it e.g. sell it, participate in DeFi, etc.
pub fn handle(ctx: Context<DepositLPTokens>, amount: u64) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    let pool_key = pool.key();
    let pool_authority_seeds = [pool_key.as_ref(), &[pool.authority_bump]];
    let clock = &ctx.accounts.clock;

    if !pool.is_active {
        return Err(ErrorCode::PoolAlreadyPaused.into());
    }

    // Transfer LP tokens to the pool
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.source.to_account_info(),
                to: ctx.accounts.destination.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            }
        ),
        amount,
    )?;

    // Mint new pool tokens equals to `amount`
    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                mint: ctx.accounts.pool_mint.to_account_info(),
                to: ctx.accounts.user_pool_token.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
            },
            &[&pool_authority_seeds],
        ),
        amount,
    )?;

    let user = &mut ctx.accounts.user;

    if user.wallet == ctx.accounts.authority.key() {
        if user.is_blocked {
            return Err(ErrorCode::UserBlocked.into());
        }
        user.num_of_collaterals += 1;
    } else {
        user.wallet = ctx.accounts.authority.key();
        user.rate = 0;
        user.is_blocked = false;
        user.num_of_collaterals = 1;
    }

    emit!(RegisterUserEvent {
        pool: pool_key,
        user: ctx.accounts.user.key(),
    });

    let collateral = &mut ctx.accounts.collateral;

    collateral.user = ctx.accounts.user.key();
    collateral.pool = pool_key;
    collateral.source_stake = ctx.accounts.lp_token.key();
    collateral.delegation_stake = amount;
    collateral.amount = amount;
    collateral.created_at = clock.unix_timestamp;
    collateral.bump = ctx.bumps["collateral"];
    collateral.is_native = false;

    pool.deposit_amount = pool.deposit_amount.saturating_add(amount);

    emit!(DepositStakeEvent {
        pool: pool.key(),
        collateral: collateral.key(),
        delegation_stake: collateral.delegation_stake,
        timestamp: clock.unix_timestamp,
        amount,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct DepositLPTokens<'info> {
    #[account(mut)]
    pub pool: Box<Account<'info, Pool>>,

    /// CHECK:
    #[account(address = pool.pool_mint)]
    pub pool_mint: AccountInfo<'info>,

    /// CHECK: no needs to check, only for signing
    #[account(seeds = [pool.key().as_ref()], bump = pool.authority_bump)]
    pub pool_authority: AccountInfo<'info>,

    #[account(
    init_if_needed,
    seeds = [
    User::SEED,
    authority.key().as_ref(),
    ],
    bump,
    payer = authority,
    space = User::SIZE,
    )]
    pub user: Box<Account<'info, User>>,

    #[account(
    init,
    seeds = [Collateral::SEED, user.key().as_ref(), &(user.num_of_collaterals + 1).to_le_bytes()],
    bump,
    payer = authority,
    space = Collateral::SIZE,
    )]
    pub collateral: Box<Account<'info, Collateral>>,

    #[account(
    mut,
    associated_token::mint = pool_mint,
    associated_token::authority = authority,
    )]
    pub user_pool_token: Account<'info, token::TokenAccount>,

    #[account(
    mut,
    associated_token::mint = lp_token,
    associated_token::authority = authority,
    )]
    pub source: Account<'info, token::TokenAccount>,

    #[account(
    mut,
    associated_token::mint = lp_token,
    associated_token::authority = pool_authority,
    )]
    pub destination: Account<'info, token::TokenAccount>,

    #[account(
    seeds = [
    Whitelist::SEED,
    lp_token.key().as_ref(),
    ],
    bump,
    )]
    pub whitelist: Box<Account<'info, Whitelist>>,

    /// CHECK: Address of a token, will be checked via whitelist
    #[account(address = whitelist.whitelisted_token)]
    pub lp_token: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub clock: Sysvar<'info, Clock>,
    pub token_program: Program<'info, token::Token>,
    pub system_program: Program<'info, System>,
}
