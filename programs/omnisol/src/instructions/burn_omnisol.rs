use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};

use crate::{
    events::WithdrawRequestCreationEvent,
    state::{Pool, User, WithdrawInfo},
    ErrorCode,
};

/// Withdraw a given amount of omniSOL (without an account).
/// Caller provides some [amount] of omni-lamports that are to be burned in
pub fn handle(ctx: Context<BurnOmnisol>, amount: u64) -> Result<()> {
    if amount == 0 {
        return Err(ErrorCode::InsufficientAmount.into());
    }

    let pool = &mut ctx.accounts.pool;
    if !pool.is_active {
        return Err(ErrorCode::PoolAlreadyPaused.into());
    }

    let pool_key = pool.key();
    let clock = &ctx.accounts.clock;

    let user = &mut ctx.accounts.user;

    if user.wallet != ctx.accounts.authority.key() {
        user.wallet = ctx.accounts.authority.key();
        user.rate = 0;
        user.is_blocked = false;
    }

    if user.is_blocked {
        return Err(ErrorCode::UserBlocked.into());
    }

    user.last_withdraw_index += 1;
    user.requests_amount += 1;

    token::burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Burn {
                mint: ctx.accounts.pool_mint.to_account_info(),
                from: ctx.accounts.source_token_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        amount,
    )?;

    let withdraw_info = &mut ctx.accounts.withdraw_info;

    withdraw_info.authority = ctx.accounts.authority.key();
    withdraw_info.amount = amount;
    withdraw_info.created_at = clock.unix_timestamp;

    emit!(WithdrawRequestCreationEvent {
        pool: pool_key,
        user: user.key(),
        amount,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct BurnOmnisol<'info> {
    #[account(mut)]
    pub pool: Box<Account<'info, Pool>>,

    /// CHECK: token program will check it
    #[account(mut, address = pool.pool_mint)]
    pub pool_mint: AccountInfo<'info>,

    #[account(
        mut,
        associated_token::mint = pool_mint,
        associated_token::authority = authority,
    )]
    pub source_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init_if_needed,
        seeds = [User::SEED, authority.key().as_ref()],
        bump,
        payer = authority,
        space = User::SIZE,
    )]
    pub user: Box<Account<'info, User>>,

    #[account(
        init,
        seeds = [
            WithdrawInfo::SEED,
            authority.key().as_ref(),
            user.next_index().to_le_bytes().as_ref()
        ],
        bump,
        payer = authority,
        space = WithdrawInfo::SIZE
    )]
    pub withdraw_info: Box<Account<'info, WithdrawInfo>>,

    pub clock: Sysvar<'info, Clock>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
