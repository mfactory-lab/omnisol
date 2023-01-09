use anchor_lang::prelude::*;

use crate::{state::Pool, ErrorCode};
use crate::state::User;

pub fn handle(ctx: Context<UnblockUser>) -> Result<()> {
    let user = &mut ctx.accounts.user;

    if !user.is_blocked {
        return Err(ErrorCode::UserNotBlocked.into());
    }

    user.is_blocked = false;

    Ok(())
}

#[derive(Accounts)]
pub struct UnblockUser<'info> {
    #[account(has_one = authority)]
    pub pool: Box<Account<'info, Pool>>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut,
    seeds = [
    User::SEED,
    user_wallet.key().as_ref(),
    ],
    bump)]
    pub user: Box<Account<'info, User>>,

    /// CHECK: Address of user wallet to block it
    pub user_wallet: AccountInfo<'info>,
}
