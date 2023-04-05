use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::token;

use crate::{
    events::*,
    state::{Collateral, Pool, User, Whitelist},
    ErrorCode,
};

/// The user can use their deposit as collateral and mint omniSOL.
/// They can now withdraw this omniSOL and do whatever they want with it e.g. sell it, participate in DeFi, etc.
pub fn handle(ctx: Context<DepositLPTokens>, amount: u64) -> Result<()> {
    if amount == 0 {
        return Err(ErrorCode::InsufficientAmount.into());
    }

    let pool = &mut ctx.accounts.pool;
    if !pool.is_active {
        return Err(ErrorCode::PoolAlreadyPaused.into());
    }

    let pool_key = pool.key();
    let clock = &ctx.accounts.clock;

    if pool.deposit_fee > 0 {
        let fee = amount.saturating_div(1000).saturating_mul(pool.deposit_fee as u64);
        msg!("Transfer deposit fee: {} lamports", fee);

        system_program::transfer(CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.fee_payer.to_account_info(),
                to: ctx.accounts.fee_receiver.to_account_info(),
            }
        ),
        fee,
        ).map_err(|_| ErrorCode::InsufficientFunds)?;
    }

    // Transfer LP tokens to the pool
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.source.to_account_info(),
                to: ctx.accounts.destination.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        amount,
    )?;

    let user = &mut ctx.accounts.user;

    if user.wallet != ctx.accounts.authority.key() {
        user.wallet = ctx.accounts.authority.key();
        user.rate = 0;
        user.is_blocked = false;

        emit!(RegisterUserEvent {
            pool: pool_key,
            user: user.key(),
        });
    }

    if user.is_blocked {
        return Err(ErrorCode::UserBlocked.into());
    }

    let collateral = &mut ctx.accounts.collateral;
    if collateral.user != user.key() {
        collateral.user = user.key();
        collateral.pool = pool_key;
        collateral.stake_source = ctx.accounts.lp_token.key();
        collateral.delegation_stake = 0;
        collateral.amount = 0;
        collateral.liquidated_amount = 0;
        collateral.created_at = clock.unix_timestamp;
        collateral.creation_epoch = clock.epoch;
        collateral.bump = ctx.bumps["collateral"];
        collateral.is_native = false;
    }

    user.rate += amount;
    collateral.delegation_stake += amount;

    pool.deposit_amount = pool.deposit_amount.checked_add(amount).ok_or(ErrorCode::TypeOverflow)?;

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
    #[account(mut, constraint = pool.stake_source == lp_token.key())]
    pub pool: Box<Account<'info, Pool>>,

    /// CHECK: no needs to check, only for signing
    #[account(seeds = [pool.key().as_ref()], bump = pool.authority_bump)]
    pub pool_authority: AccountInfo<'info>,

    #[account(
        init_if_needed,
        seeds = [User::SEED, authority.key().as_ref()],
        bump,
        payer = authority,
        space = User::SIZE,
    )]
    pub user: Box<Account<'info, User>>,

    #[account(
        init_if_needed,
        seeds = [Collateral::SEED, user.key().as_ref(), lp_token.key().as_ref()],
        bump,
        payer = authority,
        space = Collateral::SIZE,
    )]
    pub collateral: Account<'info, Collateral>,

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
        seeds = [Whitelist::SEED, lp_token.key().as_ref()],
        bump,
    )]
    pub whitelist: Box<Account<'info, Whitelist>>,

    /// CHECK: Address of a token, will be checked via whitelist
    #[account(address = whitelist.whitelisted_token)]
    pub lp_token: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub fee_payer: Signer<'info>,

    /// CHECK: no needs to check, only for transfer
    #[account(mut, address = pool.fee_receiver)]
    pub fee_receiver: AccountInfo<'info>,

    pub clock: Sysvar<'info, Clock>,
    pub token_program: Program<'info, token::Token>,
    pub system_program: Program<'info, System>,
}
