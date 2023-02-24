use anchor_lang::prelude::*;

use crate::{
    state::{Manager, User},
    ErrorCode,
};

pub fn handle(ctx: Context<BlockUser>) -> Result<()> {
    let user = &mut ctx.accounts.user;

    if user.is_blocked {
        return Err(ErrorCode::UserBlocked.into());
    }

    user.is_blocked = true;

    Ok(())
}

#[derive(Accounts)]
pub struct BlockUser<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [Manager::SEED, authority.key().as_ref()],
        bump
    )]
    pub manager: Box<Account<'info, Manager>>,

    #[account(
        mut,
        seeds = [User::SEED, user_wallet.key().as_ref()],
        bump
    )]
    pub user: Box<Account<'info, User>>,

    /// CHECK: Address of user wallet to block it
    pub user_wallet: AccountInfo<'info>,
}
