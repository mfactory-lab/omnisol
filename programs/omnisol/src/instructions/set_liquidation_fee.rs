use anchor_lang::prelude::*;

use crate::{
    state::{Manager, LiquidationFee},
    ErrorCode,
};

pub fn handle(ctx: Context<SetLiquidationFee>, fee: u8) -> Result<()> {
    let liquidation_fee = &mut ctx.accounts.liquidation_fee;

    if fee > 100 {
        msg!("Invalid fee value");
        return Err(ErrorCode::WrongData.into());
    }

    liquidation_fee.fee = fee;

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
