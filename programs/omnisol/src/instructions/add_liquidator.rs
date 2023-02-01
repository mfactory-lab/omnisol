use anchor_lang::prelude::*;

use crate::state::{Liquidator, Manager, Pool};

pub fn handle(ctx: Context<AddLiquidator>) -> Result<()> {
    let liquidator = &mut ctx.accounts.liquidator;
    let wallet_of_liquidator = ctx.accounts.wallet_of_liquidator.key();

    liquidator.authority = wallet_of_liquidator;

    Ok(())
}

#[derive(Accounts)]
pub struct AddLiquidator<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Wallet that will have authority to liquidate collaterals
    pub wallet_of_liquidator: AccountInfo<'info>,

    #[account(init,
    seeds = [Liquidator::SEED, wallet_of_liquidator.key().as_ref()],
    bump,
    payer = authority,
    space = Liquidator::SIZE
    )]
    pub liquidator: Box<Account<'info, Liquidator>>,

    #[account(mut, seeds = [Manager::SEED, authority.key().as_ref()], bump)]
    pub manager: Box<Account<'info, Manager>>,

    pub system_program: Program<'info, System>,
}
