use anchor_lang::{prelude::*, solana_program::stake::state::StakeAuthorize, system_program};

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
pub fn handle(ctx: Context<DepositStake>, amount: u64) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    if !pool.is_active {
        return Err(ErrorCode::PoolAlreadyPaused.into());
    }

    let delegation = ctx
        .accounts
        .source_stake
        .delegation()
        .ok_or(ErrorCode::InvalidStakeAccount)?;

    if amount == 0 || amount > delegation.stake {
        return Err(ErrorCode::InsufficientAmount.into());
    }

    if (amount == delegation.stake && ctx.accounts.delegated_stake.key() == ctx.accounts.split_stake.key())
        || (amount != delegation.stake && ctx.accounts.delegated_stake.key() == ctx.accounts.source_stake.key())
    {
        return Err(ErrorCode::InvalidStakeAccount.into());
    }

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

    let pool_key = pool.key();
    let clock = &ctx.accounts.clock;

    let stake_account = if amount < delegation.stake {
        // Split new stake from existing stake
        stake::split(
            CpiContext::new(
                ctx.accounts.stake_program.to_account_info(),
                stake::Split {
                    stake: ctx.accounts.source_stake.to_account_info(),
                    split_stake: ctx.accounts.split_stake.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                },
            ),
            amount,
        )?;
        ctx.accounts.split_stake.to_account_info()
    } else {
        ctx.accounts.source_stake.to_account_info()
    };

    // Authorize to `withdraw` the stake for the program
    stake::authorize(
        CpiContext::new(
            ctx.accounts.stake_program.to_account_info(),
            stake::Authorize {
                stake: stake_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
                new_authority: ctx.accounts.pool_authority.to_account_info(),
                clock: clock.to_account_info(),
            },
        ),
        StakeAuthorize::Withdrawer,
        None,
    )?;

    // Authorize to `stake` the stake for the program
    stake::authorize(
        CpiContext::new(
            ctx.accounts.stake_program.to_account_info(),
            stake::Authorize {
                stake: stake_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
                new_authority: ctx.accounts.pool_authority.to_account_info(),
                clock: clock.to_account_info(),
            },
        ),
        StakeAuthorize::Staker,
        None,
    )?;

    let user = &mut ctx.accounts.user;
    let collateral = &mut ctx.accounts.collateral;

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

    user.rate += amount;

    collateral.user = ctx.accounts.user.key();
    collateral.pool = pool_key;
    collateral.stake_source = ctx.accounts.source_stake.key();
    collateral.delegated_stake = stake_account.key();
    collateral.delegation_stake = amount;
    collateral.amount = 0;
    collateral.liquidated_amount = 0;
    collateral.created_at = clock.unix_timestamp;
    collateral.creation_epoch = clock.epoch;
    collateral.bump = ctx.bumps["collateral"];
    collateral.is_native = true;

    pool.deposit_amount = pool.deposit_amount.saturating_add(amount);

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
    #[account(mut, constraint = pool.stake_source == stake_program.key())]
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
        seeds = [Collateral::SEED, user.key().as_ref(), delegated_stake.key().as_ref()],
        bump,
        payer = authority,
        space = Collateral::SIZE,
    )]
    pub collateral: Account<'info, Collateral>,

    #[account(mut)]
    pub source_stake: Account<'info, stake::StakeAccount>,

    /// CHECK:
    #[account(mut, constraint = delegated_stake.key() == source_stake.key() || delegated_stake.key() == split_stake.key())]
    pub delegated_stake: AccountInfo<'info>,

    /// CHECK:
    #[account(mut, signer)]
    pub split_stake: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub fee_payer: Signer<'info>,

    /// CHECK: no needs to check, only for transfer
    #[account(mut, address = pool.fee_receiver)]
    pub fee_receiver: AccountInfo<'info>,

    pub clock: Sysvar<'info, Clock>,
    pub stake_program: Program<'info, stake::Stake>,
    pub system_program: Program<'info, System>,
}
