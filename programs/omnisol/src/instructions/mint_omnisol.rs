use anchor_lang::{prelude::*, system_program};
use anchor_spl::token;

use crate::{
    events::*,
    state::{Collateral, Pool, User, MINT_AUTHORITY_SEED},
    utils, ErrorCode,
};

/// The user can use their deposit to mint omniSOL.
/// They can now withdraw this omniSOL and do whatever they want with it e.g. sell it, participate in DeFi, etc.
pub fn handle(ctx: Context<MintOmnisol>, amount: u64) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    if !pool.is_active {
        return Err(ErrorCode::PoolAlreadyPaused.into());
    }

    let user = &mut ctx.accounts.user;
    if user.is_blocked {
        return Err(ErrorCode::UserBlocked.into());
    }

    let collateral = &mut ctx.accounts.collateral;

    if amount > collateral.delegation_stake - collateral.amount {
        return Err(ErrorCode::InsufficientAmount.into());
    }

    let mint_authority_seeds = [MINT_AUTHORITY_SEED, &[ctx.bumps["mint_authority"]]];
    let clock = &ctx.accounts.clock;

    if pool.mint_fee > 0 {
        let fee = amount.saturating_div(1000).saturating_mul(pool.mint_fee as u64);
        msg!("Transfer mint fee: {} lamports", fee);

        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.fee_payer.to_account_info(),
                    to: ctx.accounts.fee_receiver.to_account_info(),
                },
            ),
            fee,
        )
        .map_err(|_| ErrorCode::InsufficientFunds)?;
    }

    // Mint new pool tokens equals to `amount`
    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                mint: ctx.accounts.pool_mint.to_account_info(),
                to: ctx.accounts.user_pool_token.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
            },
            &[&mint_authority_seeds],
        ),
        amount,
    )?;

    collateral.amount += amount;
    user.rate -= amount;

    if collateral.delegation_stake == collateral.liquidated_amount && collateral.amount == collateral.delegation_stake {
        // close the collateral account
        utils::close(collateral.to_account_info(), ctx.accounts.authority.to_account_info())?;

        pool.collaterals_amount = pool.collaterals_amount.saturating_sub(1);
    }

    emit!(MintOmnisolEvent {
        pool: pool.key(),
        user: user.key(),
        collateral: collateral.key(),
        timestamp: clock.unix_timestamp,
        amount,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct MintOmnisol<'info> {
    #[account(mut, address = collateral.pool)]
    pub pool: Box<Account<'info, Pool>>,

    /// CHECK: no needs to check, only for signing
    #[account(seeds = [pool.key().as_ref()], bump = pool.authority_bump)]
    pub pool_authority: AccountInfo<'info>,

    /// CHECK:
    #[account(mut, address = pool.pool_mint)]
    pub pool_mint: AccountInfo<'info>,

    /// CHECK: no needs to check, only for signing
    #[account(seeds = [MINT_AUTHORITY_SEED], bump)]
    pub mint_authority: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [User::SEED, authority.key().as_ref()],
        bump,
    )]
    pub user: Box<Account<'info, User>>,

    #[account(
        mut,
        seeds = [Collateral::SEED, user.key().as_ref(), staked_address.key().as_ref()],
        bump,
    )]
    pub collateral: Box<Account<'info, Collateral>>,

    #[account(
        mut,
        associated_token::mint = pool_mint,
        associated_token::authority = authority,
    )]
    pub user_pool_token: Account<'info, token::TokenAccount>,

    /// CHECK: only need for seeds
    pub staked_address: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub fee_payer: Signer<'info>,

    /// CHECK: no needs to check, only for transfer
    #[account(mut, address = pool.fee_receiver)]
    pub fee_receiver: AccountInfo<'info>,

    pub clock: Sysvar<'info, Clock>,
    pub token_program: Program<'info, token::Token>,
    pub system_program: Program<'info, System>,
}
