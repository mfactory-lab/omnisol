use anchor_lang::{prelude::*, solana_program::stake::state::StakeAuthorize, system_program};
use anchor_spl::token;

use crate::{
    events::*,
    state::{Collateral, Pool, User},
    utils::{self, fee::get_storage_fee, stake},
    ErrorCode,
};

/// Withdraw a given amount of omniSOL (with an stake account).
/// Caller provides some [amount] of omni-lamports that are to be burned in.
///
/// Any omniSOL minter can at any time return withdrawn omniSOL to their account.
/// This burns the omniSOL, allowing the minter to withdraw their staked SOL.
pub fn handle(ctx: Context<WithdrawStake>, amount: u64, with_burn: bool, with_merge: bool) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    if !pool.is_active {
        return Err(ErrorCode::PoolAlreadyPaused.into());
    }

    let user = &mut ctx.accounts.user;

    if user.is_blocked {
        return Err(ErrorCode::UserBlocked.into());
    }

    let collateral = &mut ctx.accounts.collateral;

    let rest_amount = collateral.delegation_stake - collateral.liquidated_amount;

    if amount == 0 || with_burn && amount > rest_amount || !with_burn && amount > rest_amount - collateral.amount {
        return Err(ErrorCode::InsufficientAmount.into());
    }

    let pool_key = pool.key();
    let pool_authority_seeds = [pool_key.as_ref(), &[pool.authority_bump]];
    let clock = &ctx.accounts.clock;

    if pool.withdraw_fee > 0 {
        let fee = amount.saturating_div(1000).saturating_mul(pool.withdraw_fee as u64);
        msg!("Transfer withdraw fee: {} lamports", fee);

        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.fee_payer.to_account_info(),
                    to: ctx.accounts.fee_receiver.to_account_info(),
                },
            ),
            fee,
        )
        .map_err(|_| ErrorCode::InsufficientFunds)?;
    }

    let source_stake = if amount < rest_amount {
        stake::split(
            CpiContext::new_with_signer(
                ctx.accounts.stake_program.to_account_info(),
                stake::Split {
                    stake: ctx.accounts.delegated_stake.to_account_info(),
                    split_stake: ctx.accounts.split_stake.to_account_info(),
                    authority: ctx.accounts.pool_authority.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                },
                &[&pool_authority_seeds],
            ),
            amount,
        )?;
        ctx.accounts.split_stake.to_account_info()
    } else {
        ctx.accounts.delegated_stake.to_account_info()
    };

    stake::authorize(
        CpiContext::new_with_signer(
            ctx.accounts.stake_program.to_account_info(),
            stake::Authorize {
                stake: source_stake.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
                new_authority: ctx.accounts.authority.to_account_info(),
                clock: clock.to_account_info(),
            },
            &[&pool_authority_seeds],
        ),
        StakeAuthorize::Withdrawer,
        None,
    )?;

    stake::authorize(
        CpiContext::new_with_signer(
            ctx.accounts.stake_program.to_account_info(),
            stake::Authorize {
                stake: source_stake.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
                new_authority: ctx.accounts.authority.to_account_info(),
                clock: clock.to_account_info(),
            },
            &[&pool_authority_seeds],
        ),
        StakeAuthorize::Staker,
        None,
    )?;

    if source_stake.key() != ctx.accounts.source_stake.key()
        && ctx.accounts.source_stake.key() != ctx.accounts.delegated_stake.key()
    {
        stake::merge(CpiContext::new(
            ctx.accounts.stake_program.to_account_info(),
            stake::Merge {
                source_stake,
                destination_stake: ctx.accounts.source_stake.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
                stake_history: ctx.accounts.stake_history.to_account_info(),
                clock: clock.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
        ))?;
    } else if with_merge {
        stake::merge(CpiContext::new(
            ctx.accounts.stake_program.to_account_info(),
            stake::Merge {
                source_stake: source_stake.to_account_info(),
                destination_stake: ctx.accounts.mergable_stake.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
                stake_history: ctx.accounts.stake_history.to_account_info(),
                clock: clock.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
        ))?;
    }

    let mut burn_amount = 0;

    if with_burn {
        burn_amount = if amount > collateral.amount {
            collateral.amount
        } else {
            amount
        };

        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Burn {
                    mint: ctx.accounts.pool_mint.to_account_info(),
                    from: ctx.accounts.user_pool_token.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            burn_amount,
        )?;

        collateral.amount -= burn_amount;
    }

    if pool.storage_fee > 0 {
        let fee = get_storage_fee(pool.storage_fee as u64, clock.epoch, collateral.creation_epoch, amount);
        msg!("Transfer storage fee: {} lamports", fee);

        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.fee_payer.to_account_info(),
                    to: ctx.accounts.fee_receiver.to_account_info(),
                },
            ),
            fee,
        )
        .map_err(|_| ErrorCode::InsufficientFunds)?;
    }

    collateral.delegation_stake -= amount;
    user.rate -= amount - burn_amount;

    pool.deposit_amount = pool
        .deposit_amount
        .checked_sub(amount)
        .ok_or(ErrorCode::InsufficientAmount)?;

    if collateral.delegation_stake == collateral.liquidated_amount && collateral.amount == collateral.delegation_stake {
        // close the collateral account
        utils::close(collateral.to_account_info(), ctx.accounts.authority.to_account_info())?;

        pool.collaterals_amount = pool.collaterals_amount.saturating_sub(1);
    }

    emit!(WithdrawStakeEvent {
        pool: pool.key(),
        collateral: collateral.key(),
        timestamp: clock.unix_timestamp,
        rest_amount: collateral.delegation_stake - collateral.liquidated_amount,
        amount,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawStake<'info> {
    #[account(mut, address = collateral.pool)]
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
        seeds = [
            Collateral::SEED,
            user.key().as_ref(),
            delegated_stake.key().as_ref()
        ],
        bump,
    )]
    pub collateral: Account<'info, Collateral>,

    /// CHECK:
    #[account(mut, address = pool.pool_mint)]
    pub pool_mint: AccountInfo<'info>,

    #[account(mut, constraint = collateral.stake_source == source_stake.key())]
    pub source_stake: Box<Account<'info, stake::StakeAccount>>,

    #[account(mut, constraint = collateral.delegated_stake == delegated_stake.key())]
    pub delegated_stake: Box<Account<'info, stake::StakeAccount>>,

    /// CHECK: optional stake account to merge
    #[account(mut)]
    pub mergable_stake: Box<Account<'info, stake::StakeAccount>>,

    /// CHECK:
    #[account(mut, signer)]
    pub split_stake: AccountInfo<'info>,

    #[account(
        mut,
        associated_token::mint = pool_mint,
        associated_token::authority = authority,
    )]
    pub user_pool_token: Account<'info, token::TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub fee_payer: Signer<'info>,

    /// CHECK: no needs to check, only for transfer
    #[account(mut, address = pool.fee_receiver)]
    pub fee_receiver: AccountInfo<'info>,

    pub clock: Sysvar<'info, Clock>,
    pub stake_history: Sysvar<'info, StakeHistory>,
    pub stake_program: Program<'info, stake::Stake>,
    pub token_program: Program<'info, token::Token>,
    pub system_program: Program<'info, System>,
}
