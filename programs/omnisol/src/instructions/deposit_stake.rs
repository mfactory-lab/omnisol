use anchor_lang::{prelude::*, solana_program::stake::state::StakeAuthorize};

use crate::{
    events::*,
    state::{Collateral, Pool, User},
    utils::stake,
    ErrorCode,
};

/// The user can use their deposit as collateral and mint omniSOL.
/// They can now withdraw this omniSOL and do whatever they want with it e.g. sell it, participate in DeFi, etc.
/// As their stake accounts continue to earn yield, the amount of lamports under them increases.
/// Call the amount of lamports in excess of the initial deposit the **reserve amount.**
pub fn handle(ctx: Context<DepositStake>) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    if !pool.is_active {
        return Err(ErrorCode::PoolAlreadyPaused.into());
    }

    let delegation = ctx
        .accounts
        .source_stake
        .delegation()
        .ok_or(ErrorCode::InvalidStakeAccount)?;

    let pool_key = pool.key();
    let pool_authority_seeds = [pool_key.as_ref(), &[pool.authority_bump]];
    let clock = &ctx.accounts.clock;

    if delegation.stake == 0 {
        return Err(ErrorCode::InsufficientAmount.into());
    }

    // Authorize to `withdraw` the stake for the program
    stake::authorize(
        CpiContext::new(
            ctx.accounts.stake_program.to_account_info(),
            stake::Authorize {
                stake: ctx.accounts.source_stake.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
                new_authority: ctx.accounts.pool_authority.to_account_info(),
                clock: clock.to_account_info(),
            },
        ),
        StakeAuthorize::Withdrawer,
        None,
    )?;

    let user = &mut ctx.accounts.user;
    let collateral = &mut ctx.accounts.collateral;

    if user.wallet != ctx.accounts.authority.key() {
        user.wallet = ctx.accounts.authority.key();
        user.rate = 0;
        user.is_blocked = false;
    }

    if user.is_blocked {
        return Err(ErrorCode::UserBlocked.into());
    }

    user.rate += delegation.stake;

    collateral.user = ctx.accounts.user.key();
    collateral.pool = pool_key;
    collateral.source_stake = ctx.accounts.source_stake.key();
    collateral.delegation_stake = delegation.stake;
    collateral.amount = 0;
    collateral.created_at = clock.unix_timestamp;
    collateral.bump = ctx.bumps["collateral"];
    collateral.is_native = true;

    pool.deposit_amount = pool.deposit_amount.saturating_add(delegation.stake);

    emit!(RegisterUserEvent {
        pool: pool_key,
        user: ctx.accounts.user.key(),
    });

    emit!(DepositStakeEvent {
        pool: pool.key(),
        collateral: collateral.key(),
        delegation_stake: collateral.delegation_stake,
        timestamp: clock.unix_timestamp,
        amount: delegation.stake,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct DepositStake<'info> {
    #[account(mut)]
    pub pool: Box<Account<'info, Pool>>,

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
    seeds = [Collateral::SEED, user.key().as_ref(), source_stake.key().as_ref()],
    bump,
    payer = authority,
    owner = user.key(),
    space = Collateral::SIZE,
    )]
    pub collateral: Account<'info, Collateral>,

    #[account(mut)]
    pub source_stake: Account<'info, stake::StakeAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub clock: Sysvar<'info, Clock>,
    pub stake_program: Program<'info, stake::Stake>,
    pub system_program: Program<'info, System>,
}
