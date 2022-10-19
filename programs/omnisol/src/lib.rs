mod events;
mod instructions;
mod state;
mod utils;

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};

use crate::{events::*, stake::Stake, state::Pool, utils::stake};

declare_id!("36V9V9myUXLDC6vvGKkRjwXGMbjfUGJrSQ85Xhx87q1n");

#[program]
pub mod omnisol {
    use super::*;

    pub fn init_pool(ctx: Context<InitPool>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.token_mint = Pubkey::default();
        Ok(())
    }

    pub fn close_pool(_ctx: Context<ClosePool>) -> Result<()> {
        Ok(())
    }

    /// The user can use their deposit as collateral and mint omniSOL.
    /// They can now withdraw this omniSOL and do whatever they want with it e.g. sell it, participate in DeFi, etc.
    /// As their stake accounts continue to earn yield, the amount of lamports under them increases.
    /// Call the amount of lamports in excess of the initial deposit the **reserve amount.**
    pub fn deposit_stake(ctx: Context<DepositStake>, amount: u64) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let pool_key = pool.key();
        let pool_authority_seeds = [pool_key.as_ref(), &[pool.authority_bump]];

        let clock = &ctx.accounts.clock;

        // Create a new stake from existing stake
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

        // Authorize withdraw stake for program
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
            anchor_lang::solana_program::stake::state::StakeAuthorize::Withdrawer,
            None,
        )?;

        // Mint new omniSOL
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

        let stake = ctx.accounts.source_stake_account.key();

        emit!(DepositStakeEvent {
            pool: pool.key(),
            stake,
            amount,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Withdraw a given amount of omniSOL.
    /// Caller provides some [amount] of omniLamports that are to be burned in
    ///
    /// Any omniSOL minter can at any time return withdrawn omniSOL to their account.
    /// This burns the omniSOL, allowing the minter to withdraw their staked SOL.
    /// - Burning omniSOL (with an stake account)
    /// - Burning omniSOL (without an stake account)
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let pool = &mut ctx.accounts.pool;

        // Burning omniSOL (with an stake account)
        // TODO: implement

        // Burning omniSOL (without an stake account)
        // TODO: implement

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

        let timestamp = Clock::get()?.unix_timestamp;

        // emit!(WithdrawEvent {
        //     pool: pool.key(),
        //     stake,
        //     amount,
        //     timestamp,
        // });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitPool<'info> {
    #[account(mut)]
    pub pool: Box<Account<'info, Pool>>,
    #[account(mut)]
    pub pool_mint: Account<'info, token::Mint>,
    #[account(mut)]
    pub pool_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClosePool<'info> {
    #[account(mut, close = authority, has_one = authority)]
    pub pool: Box<Account<'info, Pool>>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositStake<'info> {
    #[account(mut)]
    pub pool: Box<Account<'info, Pool>>,
    #[account(mut)]
    pub pool_mint: Box<Account<'info, token::Mint>>,
    #[account(mut)]
    pub pool_token: Box<Account<'info, TokenAccount>>,
    /// CHECK:
    #[account(seeds = [pool.key().as_ref()], bump = pool.authority_bump)]
    pub pool_authority: AccountInfo<'info>,
    /// CHECK:
    #[account(mut)]
    pub source_stake_account: AccountInfo<'info>,
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

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub pool: Box<Account<'info, Pool>>,
    #[account(mut, constraint = pool_mint.key() == pool.token_mint)]
    pub pool_mint: Account<'info, token::Mint>,
    /// CHECK:
    #[account(
        mut,
        associated_token::mint = pool_mint,
        associated_token::authority = authority,
    )]
    pub source_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized action")]
    Unauthorized,
    #[msg("Invalid stake account")]
    InvalidStakeAccount,
}
