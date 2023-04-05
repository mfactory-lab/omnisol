use anchor_lang::prelude::*;

use crate::{
    state::{Pool, Manager},
    ErrorCode,
};

pub fn handle(
    ctx: Context<UpdatePool>,
    fee_receiver: Option<Pubkey>,
    withdraw_fee: Option<u16>,
    deposit_fee: Option<u16>,
    mint_fee: Option<u16>,
    storage_fee: Option<u16>
) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    if let Some(fee_receiver) = fee_receiver {
        pool.fee_receiver = fee_receiver;
    }

    if let Some(withdraw_fee) = withdraw_fee {
        if withdraw_fee > 1000 {
            msg!("Invalid withdraw fee value");
            return Err(ErrorCode::WrongData.into());
        }
        pool.withdraw_fee = withdraw_fee;
    }

    if let Some(deposit_fee) = deposit_fee {
        if deposit_fee > 1000 {
            msg!("Invalid deposit fee value");
            return Err(ErrorCode::WrongData.into());
        }
        pool.deposit_fee = deposit_fee;
    }

    if let Some(mint_fee) = mint_fee {
        if mint_fee > 1000 {
            msg!("Invalid mint fee value");
            return Err(ErrorCode::WrongData.into());
        }
        pool.mint_fee = mint_fee;
    }

    if let Some(storage_fee) = storage_fee {
        if storage_fee > 1000 {
            msg!("Invalid storage fee value");
            return Err(ErrorCode::WrongData.into());
        }
        pool.storage_fee = storage_fee;
    }

    Ok(())
}

#[derive(Accounts)]
pub struct UpdatePool<'info> {
    #[account(mut)]
    pub pool: Box<Account<'info, Pool>>,

    #[account(mut, seeds = [Manager::SEED, authority.key().as_ref()], bump)]
    pub manager: Box<Account<'info, Manager>>,

    #[account(mut)]
    pub authority: Signer<'info>,
}
