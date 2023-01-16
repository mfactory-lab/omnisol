use anchor_lang::prelude::*;

use crate::state::{Manager, Pool};

pub fn handle(_ctx: Context<RemoveManager>) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct RemoveManager<'info> {
    #[account(has_one = authority)]
    pub pool: Box<Account<'info, Pool>>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut,
        seeds = [
            Manager::SEED,
            manager_wallet.key().as_ref(),
        ],
        bump,
        close = authority
    )]
    pub manager: Box<Account<'info, Manager>>,

    /// CHECK: Address of manager to remove
    pub manager_wallet: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}
