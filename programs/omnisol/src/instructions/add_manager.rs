use anchor_lang::prelude::*;

use crate::state::{Manager, Pool};

pub fn handle(ctx: Context<AddManager>) -> Result<()> {
    let manager = &mut ctx.accounts.manager;
    let manager_wallet = ctx.accounts.manager_wallet.key();

    manager.manager = manager_wallet;

    Ok(())
}

#[derive(Accounts)]
pub struct AddManager<'info> {
    #[account(has_one = authority)]
    pub pool: Box<Account<'info, Pool>>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Address of manager to add
    pub manager_wallet: AccountInfo<'info>,

    #[account(init,
    seeds = [
    Manager::SEED,
    manager_wallet.key().as_ref(),
    ],
    bump,
    payer = authority,
    space = Manager::SIZE)]
    pub manager: Box<Account<'info, Manager>>,

    pub system_program: Program<'info, System>,
}
