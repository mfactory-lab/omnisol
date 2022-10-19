use anchor_lang::{prelude::*, solana_program::stake::state::StakeAuthorize};
use anchor_spl::token::{self, Token, TokenAccount};

use crate::{
    events::*,
    state::{Pledge, Pool},
    utils::stake::{self, Stake, StakeAccount},
};

/// The user can use their deposit as collateral and mint omniSOL.
/// They can now withdraw this omniSOL and do whatever they want with it e.g. sell it, participate in DeFi, etc.
/// As their stake accounts continue to earn yield, the amount of lamports under them increases.
/// Call the amount of lamports in excess of the initial deposit the **reserve amount.**
///
pub fn handle(ctx: Context<DepositStake>, amount: u64) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    // Split new stake from existing stake
    stake::split(
        CpiContext::new_with_signer(
            ctx.accounts.stake_program.to_account_info(),
            stake::Split {
                stake: ctx.accounts.source_stake_account.to_account_info(),
                split_stake: ctx.accounts.destination_stake_account.to_account_info(),
                authority: ctx.accounts.stake_authority.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
            &[],
        ),
        amount,
    )?;

    let pool_key = pool.key();
    let pool_authority_seeds = [pool_key.as_ref(), &[pool.authority_bump]];
    let clock = &ctx.accounts.clock;

    // Authorize to withdraw the split stake for the program
    stake::authorize(
        CpiContext::new_with_signer(
            ctx.accounts.stake_program.to_account_info(),
            stake::Authorize {
                stake: ctx.accounts.destination_stake_account.to_account_info(),
                authority: ctx.accounts.stake_authority.to_account_info(),
                new_authority: ctx.accounts.pool_authority.to_account_info(),
                clock: clock.to_account_info(),
            },
            &[&pool_authority_seeds],
        ),
        StakeAuthorize::Withdrawer,
        None,
    )?;

    // Mint new pool tokens equals to `amount`
    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                mint: ctx.accounts.pool_mint.to_account_info(),
                to: ctx.accounts.pool_token.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
            },
            &[&pool_authority_seeds],
        ),
        amount,
    )?;

    let stake = &ctx.accounts.source_stake_account;
    let delegation_stake = stake.stake().unwrap().delegation.stake;

    let pledge = &mut ctx.accounts.pledge;

    pledge.authority = ctx.accounts.authority.key();
    pledge.pool = pool_key;
    pledge.stake = stake.key();
    pledge.created_at = clock.unix_timestamp;
    pledge.delegation_stake = delegation_stake;
    pledge.amount = amount;
    pledge.bump = ctx.bumps["pledge"];

    emit!(DepositStakeEvent {
        pool: pool.key(),
        stake: stake.key(),
        amount,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct DepositStake<'info> {
    #[account(mut)]
    pub pool: Box<Account<'info, Pool>>,

    #[account(mut)]
    pub pool_mint: Box<Account<'info, token::Mint>>,

    #[account(mut)]
    pub pool_token: Account<'info, TokenAccount>,

    /// CHECK: no needs to check, only for signing
    #[account(seeds = [pool.key().as_ref()], bump = pool.authority_bump)]
    pub pool_authority: AccountInfo<'info>,

    #[account(init, payer = authority, space = Pledge::SIZE)]
    pub pledge: Box<Account<'info, Pledge>>,

    #[account(mut)]
    pub source_stake_account: Account<'info, StakeAccount>,
    /// CHECK:
    #[account(mut)]
    pub destination_stake_account: AccountInfo<'info>,
    /// CHECK:
    pub stake_authority: Signer<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub clock: Sysvar<'info, Clock>,
    pub stake_program: Program<'info, Stake>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
