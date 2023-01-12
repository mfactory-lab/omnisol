use anchor_lang::{prelude::*, solana_program::stake::state::StakeAuthorize};
use anchor_spl::token;

use crate::{
    events::*,
    state::{Collateral, Pool},
    utils::{self, stake},
    ErrorCode,
};

/// Withdraw a given amount of omniSOL (with an stake account).
/// Caller provides some [amount] of omni-lamports that are to be burned in.
///
/// Any omniSOL minter can at any time return withdrawn omniSOL to their account.
/// This burns the omniSOL, allowing the minter to withdraw their staked SOL.
pub fn handle(ctx: Context<WithdrawStake>, amount: u64) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    let collateral = &mut ctx.accounts.collateral;

    let rest_amount = collateral
        .amount
        .checked_sub(amount)
        .ok_or(ErrorCode::InsufficientAmount)?;

    let pool_key = pool.key();
    let pool_authority_seeds = [pool_key.as_ref(), &[pool.authority_bump]];
    let clock = &ctx.accounts.clock;

    let source_stake = if rest_amount > 0 {
        stake::split(
            CpiContext::new_with_signer(
                ctx.accounts.stake_program.to_account_info(),
                stake::Split {
                    stake: ctx.accounts.source_stake.to_account_info(),
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
        ctx.accounts.source_stake.to_account_info()
    };

    if source_stake.key() == ctx.accounts.destination_stake.key() {
        stake::authorize(
            CpiContext::new_with_signer(
                ctx.accounts.stake_program.to_account_info(),
                stake::Authorize {
                    stake: source_stake,
                    authority: ctx.accounts.pool_authority.to_account_info(),
                    new_authority: ctx.accounts.stake_authority.to_account_info(),
                    clock: clock.to_account_info(),
                },
                &[&pool_authority_seeds],
            ),
            StakeAuthorize::Withdrawer,
            None,
        )?;
    } else {
        stake::merge(CpiContext::new_with_signer(
            ctx.accounts.stake_program.to_account_info(),
            stake::Merge {
                source_stake,
                destination_stake: ctx.accounts.destination_stake.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
                stake_history: ctx.accounts.stake_history.to_account_info(),
                clock: clock.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
            &[&pool_authority_seeds],
        ))?;
    }

    token::burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Burn {
                mint: ctx.accounts.pool_mint.to_account_info(),
                from: ctx.accounts.source_token_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        amount,
    )?;

    if rest_amount == 0 {
        // close the collateral account
        utils::close(collateral.to_account_info(), ctx.accounts.authority.to_account_info())?;
    } else {
        collateral.amount = rest_amount;
    }

    emit!(WithdrawStakeEvent {
        pool: pool.key(),
        collateral: collateral.key(),
        timestamp: clock.unix_timestamp,
        rest_amount,
        amount,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawStake<'info> {
    #[account(mut)]
    pub pool: Box<Account<'info, Pool>>,

    #[account(address = pool.pool_mint)]
    pub pool_mint: Account<'info, token::Mint>,

    /// CHECK: no needs to check, only for signing
    #[account(seeds = [pool.key().as_ref()], bump = pool.authority_bump)]
    pub pool_authority: AccountInfo<'info>,
    // , has_one = user
    #[account(mut, has_one = pool)]
    pub collateral: Box<Account<'info, Collateral>>,

    #[account(mut, constraint = collateral.source_stake == destination_stake.key())]
    pub destination_stake: Box<Account<'info, stake::StakeAccount>>,

    #[account(mut, constraint = collateral.source_stake == source_stake.key())]
    pub source_stake: Account<'info, stake::StakeAccount>,

    /// CHECK:
    #[account(mut)]
    pub split_stake: AccountInfo<'info>,

    #[account(
        mut,
        associated_token::mint = pool_mint,
        associated_token::authority = authority,
    )]
    pub source_token_account: Account<'info, token::TokenAccount>,

    pub stake_authority: Signer<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub clock: Sysvar<'info, Clock>,
    pub stake_history: Sysvar<'info, StakeHistory>,
    pub stake_program: Program<'info, stake::Stake>,
    pub token_program: Program<'info, token::Token>,
    pub system_program: Program<'info, System>,
}
