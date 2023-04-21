use anchor_lang::{prelude::*, system_program};
use anchor_spl::token;

use crate::{
    events::*,
    state::{Collateral, Pool, User},
    utils,
    utils::fee::get_storage_fee,
    ErrorCode,
};

/// The user can withdraw liquidity pool tokens from collateral.
/// There will be an error if collateral`s delegation has already been liquidated.
/// Caller provides some [amount] of lp-token-lamports that are to be withdrawn.
/// Caller provides [with_burn] flag that indicates the priority of withdrawal.
/// If [with_burn] is true, than firstly all possible omniSol will be burned (in equivalent of withdrawal amount).
pub fn handle(ctx: Context<WithdrawLPTokens>, amount: u64, with_burn: bool) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    if !pool.is_active {
        return Err(ErrorCode::PoolAlreadyPaused.into());
    }

    let user = &mut ctx.accounts.user;

    if user.is_blocked {
        return Err(ErrorCode::UserBlocked.into());
    }

    let collateral = &mut ctx.accounts.collateral;

    let rest_amount = collateral.delegation_stake - collateral.liquidated_amount;

    if amount == 0 || with_burn && amount > rest_amount || !with_burn && amount > rest_amount - collateral.amount {
        return Err(ErrorCode::InsufficientAmount.into());
    }

    let pool_key = pool.key();
    let pool_authority_seeds = [pool_key.as_ref(), &[pool.authority_bump]];
    let clock = &ctx.accounts.clock;

    if pool.withdraw_fee > 0 {
        let fee = amount.saturating_div(1000).saturating_mul(pool.withdraw_fee as u64);
        msg!("Transfer withdraw fee: {} lamports", fee);

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

    // Transfer LP tokens to the user
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.source.to_account_info(),
                to: ctx.accounts.destination.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
            },
            &[&pool_authority_seeds],
        ),
        amount,
    )?;

    let mut burn_amount = 0;

    if with_burn {
        burn_amount = if amount > collateral.amount {
            collateral.amount
        } else {
            amount
        };

        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Burn {
                    mint: ctx.accounts.pool_mint.to_account_info(),
                    from: ctx.accounts.user_pool_token.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            burn_amount,
        )?;

        collateral.amount -= burn_amount;
    }

    if pool.storage_fee > 0 {
        let fee = get_storage_fee(pool.storage_fee as u64, clock.epoch, collateral.creation_epoch, amount);
        msg!("Transfer storage fee: {} lamports", fee);

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

    collateral.delegation_stake -= amount;
    user.rate -= amount - burn_amount;

    pool.deposit_amount = pool
        .deposit_amount
        .checked_sub(amount)
        .ok_or(ErrorCode::InsufficientAmount)?;

    if collateral.delegation_stake == collateral.liquidated_amount && collateral.amount == collateral.delegation_stake {
        // close the collateral account
        utils::close(collateral.to_account_info(), ctx.accounts.authority.to_account_info())?;

        pool.collaterals_amount = pool.collaterals_amount.saturating_sub(1);
    }

    emit!(WithdrawStakeEvent {
        pool: pool.key(),
        collateral: collateral.key(),
        amount,
        rest_amount: collateral.delegation_stake - collateral.liquidated_amount,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawLPTokens<'info> {
    #[account(mut, address = collateral.pool)]
    pub pool: Box<Account<'info, Pool>>,

    /// CHECK: no needs to check, only for signing
    #[account(seeds = [pool.key().as_ref()], bump = pool.authority_bump)]
    pub pool_authority: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [User::SEED, authority.key().as_ref()],
        bump,
    )]
    pub user: Box<Account<'info, User>>,

    #[account(
        mut,
        seeds = [
            Collateral::SEED,
            user.key().as_ref(),
            lp_token.key().as_ref()
        ],
        bump,
    )]
    pub collateral: Box<Account<'info, Collateral>>,

    #[account(
        mut,
        associated_token::mint = lp_token,
        associated_token::authority = pool_authority,
    )]
    pub source: Account<'info, token::TokenAccount>,

    #[account(
        mut,
        associated_token::mint = lp_token,
        associated_token::authority = authority,
    )]
    pub destination: Account<'info, token::TokenAccount>,

    /// CHECK: Address of a token
    pub lp_token: AccountInfo<'info>,

    /// CHECK:
    #[account(mut, address = pool.pool_mint)]
    pub pool_mint: AccountInfo<'info>,

    #[account(
        mut,
        associated_token::mint = pool_mint,
        associated_token::authority = authority,
    )]
    pub user_pool_token: Account<'info, token::TokenAccount>,

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
