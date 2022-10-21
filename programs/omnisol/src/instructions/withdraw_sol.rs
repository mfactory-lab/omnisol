use anchor_lang::prelude::*;
use anchor_spl::{
    token,
    token::{Token, TokenAccount},
};

use crate::{
    events::*,
    state::{Pool, Withdrawal},
};

/// Withdraw a given amount of omniSOL (without an account).
/// Caller provides some [amount] of omni-lamports that are to be burned in
///
/// TODO: get account from priority queue
/// TODO: liquidate the account
/// TODO: transfer sol or split stake?
pub fn handle(ctx: Context<WithdrawSol>, amount: u64) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    let withdrawal = &mut ctx.accounts.withdrawal;

    withdrawal.id = pool.withdraw_count;
    withdrawal.authority = ctx.accounts.authority.key();
    withdrawal.amount = amount;
    withdrawal.bump = ctx.bumps["withdrawal"];

    pool.withdraw_count = pool.withdraw_count.saturating_add(1);

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

    let timestamp = Clock::get()?.unix_timestamp;

    emit!(WithdrawSolEvent {
        pool: pool.key(),
        withdrawal: withdrawal.key(),
        authority: withdrawal.authority.key(),
        amount,
        timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawSol<'info> {
    #[account(mut)]
    pub pool: Box<Account<'info, Pool>>,

    #[account(address = pool.pool_mint)]
    pub pool_mint: Account<'info, token::Mint>,

    #[account(
        init,
        seeds = [Withdrawal::SEED, pool.key().as_ref(), pool.withdraw_count.to_le_bytes()],
        bump,
        payer = authority,
        space = Withdrawal::SIZE,
    )]
    pub withdrawal: Box<Account<'info, Withdrawal>>,

    #[account(
        mut,
        associated_token::mint = pool_mint,
        associated_token::authority = authority,
    )]
    pub source_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
