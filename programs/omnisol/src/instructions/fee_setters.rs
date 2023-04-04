use anchor_lang::prelude::*;

use crate::{
    state::{Pool, Manager},
    ErrorCode,
};

pub fn set_mint_fee(ctx: Context<SetFee>, fee: u8) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    if fee > 100 || fee == pool.mint_fee {
        msg!("Invalid fee value");
        return Err(ErrorCode::WrongData.into());
    }

    pool.mint_fee = fee;

    Ok(())
}

pub fn set_deposit_fee(ctx: Context<SetFee>, fee: u8) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    if fee > 100 || fee == pool.deposit_fee {
        msg!("Invalid fee value");
        return Err(ErrorCode::WrongData.into());
    }

    pool.deposit_fee = fee;

    Ok(())
}

pub fn set_withdraw_fee(ctx: Context<SetFee>, fee: u8) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    if fee > 100 || fee == pool.withdraw_fee {
        msg!("Invalid fee value");
        return Err(ErrorCode::WrongData.into());
    }

    pool.withdraw_fee = fee;

    Ok(())
}

pub fn set_storage_fee(ctx: Context<SetFee>, fee: u8) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    if fee > 100 || fee == pool.storage_fee {
        msg!("Invalid fee value");
        return Err(ErrorCode::WrongData.into());
    }

    pool.storage_fee = fee;

    Ok(())
}

#[derive(Accounts)]
pub struct SetFee<'info> {
    #[account(mut)]
    pub pool: Box<Account<'info, Pool>>,

    #[account(mut, seeds = [Manager::SEED, authority.key().as_ref()], bump)]
    pub manager: Box<Account<'info, Manager>>,

    #[account(mut)]
    pub authority: Signer<'info>,
}
