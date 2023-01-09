use anchor_lang::{prelude::*, solana_program::stake::state::StakeAuthorize};
use anchor_spl::token;

use crate::{
    events::*,
    state::{Collateral, Pool},
    utils::stake,
    ErrorCode,
};

/// The user can use their deposit as collateral and mint omniSOL.
/// They can now withdraw this omniSOL and do whatever they want with it e.g. sell it, participate in DeFi, etc.
/// As their stake accounts continue to earn yield, the amount of lamports under them increases.
/// Call the amount of lamports in excess of the initial deposit the **reserve amount.**
pub fn handle(ctx: Context<DepositStake>, amount: u64) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    let delegation = ctx
        .accounts
        .source_stake
        .delegation()
        .ok_or(ErrorCode::InvalidStakeAccount)?;

    let pool_key = pool.key();
    let pool_authority_seeds = [pool_key.as_ref(), &[pool.authority_bump]];
    let clock = &ctx.accounts.clock;

    let stake_account = if amount < delegation.stake {
        // Split new stake from existing stake
        stake::split(
            CpiContext::new_with_signer(
                ctx.accounts.stake_program.to_account_info(),
                stake::Split {
                    stake: ctx.accounts.source_stake.to_account_info(),
                    split_stake: ctx.accounts.split_stake.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                },
                &[],
            ),
            amount,
        )?;
        ctx.accounts.split_stake.to_account_info()
    } else {
        ctx.accounts.source_stake.to_account_info()
    };

    // Authorize to `withdraw` the split stake for the program
    stake::authorize(
        CpiContext::new(
            ctx.accounts.stake_program.to_account_info(),
            stake::Authorize {
                stake: stake_account.clone(),
                authority: ctx.accounts.authority.to_account_info(),
                new_authority: ctx.accounts.pool_authority.to_account_info(),
                clock: clock.to_account_info(),
            },
        ),
        StakeAuthorize::Withdrawer,
        None,
    )?;

    // Mint new pool tokens equals to `amount`
    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                mint: ctx.accounts.pool_mint.to_account_info(),
                to: ctx.accounts.user_pool_token.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
            },
            &[&pool_authority_seeds],
        ),
        amount,
    )?;

    let collateral = &mut ctx.accounts.collateral;

    collateral.authority = ctx.accounts.authority.key();
    collateral.pool = pool_key;
    collateral.source_stake = ctx.accounts.source_stake.key();
    collateral.split_stake = stake_account.key();
    collateral.delegation_stake = delegation.stake;
    collateral.amount = amount;
    collateral.created_at = clock.unix_timestamp;
    collateral.bump = ctx.bumps["collateral"];

    pool.deposit_amount = pool.deposit_amount.saturating_add(amount);

    emit!(DepositStakeEvent {
        pool: pool.key(),
        collateral: collateral.key(),
        delegation_stake: collateral.delegation_stake,
        timestamp: clock.unix_timestamp,
        amount,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct DepositStake<'info> {
    #[account(mut)]
    pub pool: Box<Account<'info, Pool>>,

    /// CHECK:
    #[account(address = pool.pool_mint)]
    pub pool_mint: AccountInfo<'info>,

    /// CHECK: no needs to check, only for signing
    #[account(seeds = [pool.key().as_ref()], bump = pool.authority_bump)]
    pub pool_authority: AccountInfo<'info>,

    #[account(
        init,
        seeds = [Collateral::SEED, pool.key().as_ref(), source_stake.key().as_ref()],
        bump,
        payer = authority,
        space = Collateral::SIZE,
    )]
    pub collateral: Box<Account<'info, Collateral>>,

    #[account(
        mut,
        associated_token::mint = pool_mint,
        associated_token::authority = authority,
    )]
    pub user_pool_token: Account<'info, token::TokenAccount>,

    #[account(mut)]
    pub source_stake: Account<'info, stake::StakeAccount>,
    /// CHECK:
    #[account(mut, signer)]
    pub split_stake: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub clock: Sysvar<'info, Clock>,
    pub stake_program: Program<'info, stake::Stake>,
    pub token_program: Program<'info, token::Token>,
    pub system_program: Program<'info, System>,
}
