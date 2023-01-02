mod events;
mod instructions;
mod state;
mod utils;

use anchor_lang::prelude::*;

use crate::instructions::*;

declare_id!("36V9V9myUXLDC6vvGKkRjwXGMbjfUGJrSQ85Xhx87q1n");

#[program]
pub mod omnisol {
    use super::*;

    pub fn init_pool(ctx: Context<InitPool>) -> Result<()> {
        init_pool::handle(ctx)
    }

    pub fn close_pool(ctx: Context<ClosePool>) -> Result<()> {
        close_pool::handle(ctx)
    }

    pub fn deposit_stake(ctx: Context<DepositStake>, amount: u64) -> Result<()> {
        deposit_stake::handle(ctx, amount)
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
}
