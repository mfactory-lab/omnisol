use anchor_lang::prelude::*;

use crate::{
    state::{LiquidationFee, Manager},
    ErrorCode,
};

/// The manager can set liquidation fee.
pub fn handle(ctx: Context<SetLiquidationFee>, fee: Option<u16>, fee_receiver: Option<Pubkey>) -> Result<()> {
    let liquidation_fee = &mut ctx.accounts.liquidation_fee;

    if let Some(fee_receiver) = fee_receiver {
        liquidation_fee.fee_receiver = fee_receiver;
    }

    if let Some(fee) = fee {
        if fee > 1000 {
            msg!("Invalid liquidation fee value");
            return Err(ErrorCode::WrongData.into());
        }
        liquidation_fee.fee = fee;
    }

    Ok(())
}

#[derive(Accounts)]
pub struct SetLiquidationFee<'info> {
    #[account(
        init_if_needed,
        seeds = [LiquidationFee::SEED],
        bump,
        payer = authority,
        space = LiquidationFee::SIZE,
    )]
    pub liquidation_fee: Box<Account<'info, LiquidationFee>>,

    #[account(mut, seeds = [Manager::SEED, authority.key().as_ref()], bump)]
    pub manager: Box<Account<'info, Manager>>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}
