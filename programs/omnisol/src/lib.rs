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
        deposit::handle(ctx, amount)
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        withdraw::handle(ctx, amount)
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized action")]
    Unauthorized,
    #[msg("Invalid stake account")]
    InvalidStakeAccount,
}
