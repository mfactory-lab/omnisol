use anchor_lang::prelude::*;
use anchor_spl::{
    token,
    token::{Token, TokenAccount},
};

use crate::{
    events::*,
    state::{Pledge, Pool},
    utils::{
        self,
        stake::{self, Stake, StakeAccount},
    },
    ErrorCode,
};

/// Withdraw a given amount of omniSOL (with an stake account).
/// Caller provides some [amount] of omni-lamports that are to be burned in.
///
/// Any omniSOL minter can at any time return withdrawn omniSOL to their account.
/// This burns the omniSOL, allowing the minter to withdraw their staked SOL.
pub fn handle(ctx: Context<WithdrawStake>, amount: u64) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    let pledge = &mut ctx.accounts.pledge;

    let rest_amount = pledge.amount.checked_sub(amount).ok_or(ErrorCode::InsufficientAmount)?;

    let pool_key = pool.key();
    let pool_authority_seeds = [pool_key.as_ref(), &[pool.authority_bump]];
    let clock = &ctx.accounts.clock;

    let source_stake = if rest_amount > 0 {
        let stake = &ctx.accounts.ephemeral_stake;
        stake::split(
            CpiContext::new_with_signer(
                ctx.accounts.stake_program.to_account_info(),
                stake::Split {
                    stake: ctx.accounts.split_stake.to_account_info(),
                    split_stake: stake.to_account_info(),
                    authority: ctx.accounts.pool_authority.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                },
                &[&pool_authority_seeds],
            ),
            amount,
        )?;
        stake.to_account_info()
    } else {
        ctx.accounts.split_stake.to_account_info()
    };

    stake::merge(CpiContext::new_with_signer(
        ctx.accounts.stake_program.to_account_info(),
        stake::Merge {
            source_stake,
            destination_stake: ctx.accounts.source_stake.to_account_info(),
            authority: ctx.accounts.pool_authority.to_account_info(),
            stake_history: ctx.accounts.stake_history.to_account_info(),
            clock: clock.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        },
        &[&pool_authority_seeds],
    ))?;

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
        // close the pledge account
        utils::close(pledge.to_account_info(), ctx.accounts.authority.to_account_info())?;
    } else {
        pledge.amount = rest_amount;
    }

    let timestamp = Clock::get()?.unix_timestamp;

    emit!(WithdrawStakeEvent {
        pool: pool.key(),
        pledge: pledge.key(),
        amount,
        rest_amount,
        timestamp,
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

    #[account(mut, has_one = pool, has_one = authority)]
    pub pledge: Box<Account<'info, Pledge>>,

    #[account(mut, constraint = pledge.source_stake == source_stake)]
    pub source_stake: Account<'info, StakeAccount>,

    #[account(mut, constraint = pledge.split_stake == split_stake)]
    pub split_stake: Account<'info, StakeAccount>,

    /// CHECK:
    #[account(mut)]
    pub ephemeral_stake: AccountInfo<'info>,

    #[account(
        mut,
        associated_token::mint = pool_mint,
        associated_token::authority = authority,
    )]
    pub source_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub clock: Sysvar<'info, Clock>,
    pub stake_history: Sysvar<'info, StakeHistory>,
    pub stake_program: Program<'info, Stake>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
