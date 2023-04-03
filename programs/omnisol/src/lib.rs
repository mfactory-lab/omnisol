pub mod events;
pub mod instructions;
pub mod state;
mod utils;

use anchor_lang::prelude::*;

use crate::instructions::*;

declare_id!("6sccaGNYx7RSjVgFD13UKE7dyUiNavr2KXgeqaQvZUz7");

#[program]
pub mod omnisol {
    use super::*;

    pub fn init_pool(ctx: Context<InitPool>) -> Result<()> {
        init_pool::handle(ctx)
    }

    pub fn add_manager(ctx: Context<AddManager>) -> Result<()> {
        add_manager::handle(ctx)
    }

    pub fn remove_manager(ctx: Context<RemoveManager>) -> Result<()> {
        remove_manager::handle(ctx)
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

    pub fn deposit_stake(ctx: Context<DepositStake>, amount: u64) -> Result<()> {
        deposit_stake::handle(ctx, amount)
    }

    pub fn mint_omnisol(ctx: Context<MintOmnisol>, amount: u64) -> Result<()> {
        mint_omnisol::handle(ctx, amount)
    }

    pub fn withdraw_lp_tokens(ctx: Context<WithdrawLPTokens>, amount: u64, with_burn: bool) -> Result<()> {
        withdraw_lp_tokens::handle(ctx, amount, with_burn)
    }

    pub fn withdraw_stake(ctx: Context<WithdrawStake>, amount: u64, with_burn: bool, with_merge: bool) -> Result<()> {
        withdraw_stake::handle(ctx, amount, with_burn, with_merge)
    }

    pub fn burn_omnisol(ctx: Context<BurnOmnisol>, amount: u64) -> Result<()> {
        burn_omnisol::handle(ctx, amount)
    }

    pub fn init_oracle(ctx: Context<InitOracle>) -> Result<()> {
        init_oracle::handle(ctx)
    }

    pub fn close_oracle(ctx: Context<CloseOracle>) -> Result<()> {
        close_oracle::handle(ctx)
    }

    pub fn update_oracle_info(ctx: Context<UpdateOracleInfo>, addresses: Vec<Pubkey>, values: Vec<u64>, to_clear: bool) -> Result<()> {
        update_oracle_info::handle(ctx, addresses, values, to_clear)
    }

    pub fn add_liquidator(ctx: Context<AddLiquidator>) -> Result<()> {
        add_liquidator::handle(ctx)
    }

    pub fn remove_liquidator(ctx: Context<RemoveLiquidator>) -> Result<()> {
        remove_liquidator::handle(ctx)
    }

    pub fn liquidate_collateral<'info>(
        ctx: Context<'_, '_, '_, 'info, LiquidateCollateral<'info>>,
        amount: u64,
    ) -> Result<()> {
        liquidate_collateral::handle(ctx, amount)
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized action")]
    Unauthorized,
    #[msg("Invalid stake account")]
    InvalidStakeAccount,
    #[msg("Invalid token")]
    InvalidToken,
    #[msg("Insufficient amount")]
    InsufficientAmount,
    #[msg("Type overflow")]
    TypeOverflow,
    #[msg("Pool is already paused")]
    PoolAlreadyPaused,
    #[msg("Pool is already resumed")]
    PoolAlreadyResumed,
    #[msg("User is blocked")]
    UserBlocked,
    #[msg("User is not blocked")]
    UserNotBlocked,
    #[msg("Wrong input data")]
    WrongData,
}
