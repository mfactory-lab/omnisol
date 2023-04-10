use anchor_lang::prelude::*;

use crate::{
    state::{Manager, Pool},
    utils::fee::check_fee,
};

pub fn handle(ctx: Context<UpdatePool>, data: UpdatePoolData) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    if let Some(fee_receiver) = data.fee_receiver {
        pool.fee_receiver = fee_receiver;
    }

    if let Some(withdraw_fee) = data.withdraw_fee {
        check_fee(withdraw_fee)?;
        pool.withdraw_fee = withdraw_fee;
    }

    if let Some(deposit_fee) = data.deposit_fee {
        check_fee(deposit_fee)?;
        pool.deposit_fee = deposit_fee;
    }

    if let Some(mint_fee) = data.mint_fee {
        check_fee(mint_fee)?;
        pool.mint_fee = mint_fee;
    }

    if let Some(storage_fee) = data.storage_fee {
        check_fee(storage_fee)?;
        pool.storage_fee = storage_fee;
    }

    if let Some(min_deposit) = data.min_deposit {
        pool.min_deposit = min_deposit;
    }

    Ok(())
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct UpdatePoolData {
    fee_receiver: Option<Pubkey>,
    withdraw_fee: Option<u16>,
    deposit_fee: Option<u16>,
    mint_fee: Option<u16>,
    storage_fee: Option<u16>,
    min_deposit: Option<u64>,
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
