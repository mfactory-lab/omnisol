mod events;
mod instructions;
mod state;
mod utils;

use anchor_lang::prelude::*;

use crate::instructions::*;

declare_id!("9SfbhzHrx5xczfoiTo2VVpG5oukcS5Schgy2ppLH3zQd");

#[program]
pub mod omnisol {
    use super::*;

    pub fn init_pool(ctx: Context<InitPool>) -> Result<()> {
        init_pool::handle(ctx)
    }

    pub fn pause_pool(ctx: Context<PausePool>) -> Result<()> {
        pause_pool::handle(ctx)
    }

    pub fn resume_pool(ctx: Context<ResumePool>) -> Result<()> {
        resume_pool::handle(ctx)
    }

    pub fn add_to_whitelist(ctx: Context<AddToWhitelist>) -> Result<()> {
        add_to_whitelist::handle(ctx)
    }

    pub fn remove_from_whitelist(ctx: Context<RemoveFromWhitelist>) -> Result<()> {
        remove_from_whitelist::handle(ctx)
    }

    pub fn block_user(ctx: Context<BlockUser>) -> Result<()> {
        block_user::handle(ctx)
    }

    pub fn unblock_user(ctx: Context<UnblockUser>) -> Result<()> {
        unblock_user::handle(ctx)
    }

    pub fn close_pool(ctx: Context<ClosePool>) -> Result<()> {
        close_pool::handle(ctx)
    }

    pub fn deposit_lp(ctx: Context<DepositLPTokens>, amount: u64) -> Result<()> {
        deposit_lp_tokens::handle(ctx, amount)
    }

    pub fn deposit_stake(ctx: Context<DepositStake>) -> Result<()> {
        deposit_stake::handle(ctx)
    }

    pub fn withdraw_stake(ctx: Context<WithdrawStake>, amount: u64) -> Result<()> {
        withdraw_stake::handle(ctx, amount)
    }

    pub fn withdraw_sol<'info>(ctx: Context<'_, '_, '_, 'info, WithdrawSol<'info>>, amount: u64) -> Result<()> {
        withdraw_sol::handle(ctx, amount)
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized action")]
    Unauthorized,
    #[msg("Invalid stake account")]
    InvalidStakeAccount,
    #[msg("Insufficient amount")]
    InsufficientAmount,
    #[msg("Pool is already paused")]
    PoolAlreadyPaused,
    #[msg("Pool is already resumed")]
    PoolAlreadyResumed,
    #[msg("User is blocked")]
    UserBlocked,
    #[msg("User is not blocked")]
    UserNotBlocked,
}
