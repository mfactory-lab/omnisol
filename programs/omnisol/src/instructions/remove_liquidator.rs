use anchor_lang::prelude::*;

use crate::state::{Liquidator, Manager};

pub fn handle(_ctx: Context<RemoveLiquidator>) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct RemoveLiquidator<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Wallet that will have authority to liquidate collaterals
    pub wallet_of_liquidator: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [
            Liquidator::SEED,
            wallet_of_liquidator.key().as_ref()
        ],
        bump,
        close = authority,
    )]
    pub liquidator: Box<Account<'info, Liquidator>>,

    #[account(
        mut,
        seeds = [
            Manager::SEED,
            authority.key().as_ref(),
        ],
        bump,
    )]
    pub manager: Box<Account<'info, Manager>>,

    pub system_program: Program<'info, System>,
}
