use anchor_lang::prelude::*;
use anchor_spl::{
    token,
    token::{Token, TokenAccount},
};

use crate::state::Pool;

/// Withdraw a given amount of omniSOL.
/// Caller provides some [amount] of omniLamports that are to be burned in
///
/// Any omniSOL minter can at any time return withdrawn omniSOL to their account.
/// This burns the omniSOL, allowing the minter to withdraw their staked SOL.
/// - Burning omniSOL (with an stake account)
/// - Burning omniSOL (without an stake account)
///
pub fn handle(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    // Burning omniSOL (with an stake account)
    // TODO: implement

    // Burning omniSOL (without an stake account)
    // TODO: implement

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

    // emit!(WithdrawEvent {
    //     pool: pool.key(),
    //     stake,
    //     amount,
    //     timestamp,
    // });

    Ok(())
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub pool: Box<Account<'info, Pool>>,

    #[account(address = pool.pool_mint)]
    pub pool_mint: Account<'info, token::Mint>,

    /// CHECK:
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
