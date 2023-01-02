use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};

use crate::{
    state::Pool,
    utils::{stake, unstake_it},
};
use crate::utils::unstake_it::Unstake;

/// Withdraw a given amount of omniSOL (without an account).
/// Caller provides some [amount] of omni-lamports that are to be burned in
///
/// TODO: get account from priority queue
/// TODO: liquidate the account
/// TODO: transfer sol or split stake?
pub fn handle<'info>(ctx: Context<'_, '_, '_, 'info, WithdrawSol<'info>>, amount: u64) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    let pool_key = pool.key();
    let pool_authority_seeds = [pool_key.as_ref(), &[pool.authority_bump]];

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

    // TODO: get from oracle
    let stake_account = ctx.remaining_accounts.get(0).unwrap();

    let pool_account = ctx.remaining_accounts.get(0).expect("Expect #0 account");
    let pool_sol_reserves = ctx.remaining_accounts.get(1).expect("Expect #1 account");
    let fee_account = ctx.remaining_accounts.get(2).expect("Expect #2 account");
    let stake_account_record_account = ctx.remaining_accounts.get(3).expect("Expect #3 account");
    let protocol_fee_account = ctx.remaining_accounts.get(4).expect("Expect #4 account");
    let protocol_fee_destination = ctx.remaining_accounts.get(5).expect("Expect #5 account");

    unstake_it::unstake(CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        unstake_it::Unstake {
            payer: ctx.accounts.authority.to_account_info(),
            unstaker: ctx.accounts.pool_authority.to_account_info(),
            stake_account: stake_account.to_account_info(),
            destination: ctx.accounts.authority.to_account_info(), // TODO: destination account
            pool_account: pool_account.to_account_info(),
            pool_sol_reserves: pool_sol_reserves.to_account_info(),
            fee_account: fee_account.to_account_info(),
            stake_account_record_account: stake_account_record_account.to_account_info(),
            protocol_fee_account: protocol_fee_account.to_account_info(),
            protocol_fee_destination: protocol_fee_destination.to_account_info(),
            clock: ctx.accounts.clock.to_account_info(),
            stake_program: ctx.accounts.stake_program.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        },
        &[&pool_authority_seeds],
    ))?;

    // let timestamp = Clock::get()?.unix_timestamp;

    // emit!(WithdrawSolEvent {
    //      pool: pool.key(),
    //      authority: withdrawal.owner.key(),
    //      amount,
    //      timestamp,
    // });

    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawSol<'info> {
    #[account(mut)]
    pub pool: Box<Account<'info, Pool>>,

    /// CHECK: token program will check it
    #[account(address = pool.pool_mint)]
    pub pool_mint: AccountInfo<'info>,

    /// CHECK: no needs to check, only for signing
    #[account(seeds = [pool.key().as_ref()], bump = pool.authority_bump)]
    pub pool_authority: AccountInfo<'info>,

    #[account(
        mut,
        associated_token::mint = pool_mint,
        associated_token::authority = authority,
    )]
    pub source_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub clock: Sysvar<'info, Clock>,
    pub stake_program: Program<'info, stake::Stake>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
