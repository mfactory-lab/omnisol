use anchor_lang::{
    prelude::*,
    solana_program::program::invoke_signed,
};
use anchor_spl::token;
use spl_stake_pool::{
    id,
    instruction::{withdraw_sol, withdraw_stake},
};

use crate::{
    events::*,
    state::{Collateral, Liquidator, Oracle, Pool, User, WithdrawInfo},
    utils,
    utils::{stake, unstake_it},
    ErrorCode,
};

/// The user can use their deposit as collateral and mint omniSOL.
/// They can now withdraw this omniSOL and do whatever they want with it e.g. sell it, participate in DeFi, etc.
pub fn handle<'info>(ctx: Context<'_, '_, '_, 'info, LiquidateCollateral<'info>>, amount: u64) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    if !pool.is_active {
        return Err(ErrorCode::PoolAlreadyPaused.into());
    }

    let user = &mut ctx.accounts.user;
    let collateral_owner = &mut ctx.accounts.collateral_owner;

    if collateral_owner.is_blocked {
        msg!("Collateral owner is blocked");
    }

    if user.is_blocked {
        return Err(ErrorCode::UserBlocked.into());
    }

    let collateral = &mut ctx.accounts.collateral;
    let oracle = &mut ctx.accounts.oracle;

    let rest_amount = collateral.delegation_stake - collateral.liquidated_amount;

    if amount == 0 || amount > rest_amount {
        return Err(ErrorCode::InsufficientAmount.into());
    }

    let mut queue_member = oracle.priority_queue
        .iter_mut()
        .find(|queue_member| queue_member.collateral == collateral.key() && queue_member.amount == rest_amount)
        .ok_or::<Error>(ErrorCode::WrongData.into())?;

    queue_member.amount -= amount;

    let pool_key = pool.key();
    let pool_authority_seeds = [pool_key.as_ref(), &[pool.authority_bump]];
    let clock = &ctx.accounts.clock;

    let withdraw_info = &mut ctx.accounts.withdraw_info;

    if amount > withdraw_info.amount {
        return Err(ErrorCode::InsufficientAmount.into());
    }

    if collateral.is_native {
        if collateral.delegated_stake != ctx.accounts.source_stake.key() {
            return Err(ErrorCode::InvalidStakeAccount.into());
        }

        let split_stake = ctx.remaining_accounts.get(0).expect("Expect #0 account");

        let stake_account = if amount < rest_amount {
            // Split new stake from existing stake
            stake::split(
                CpiContext::new_with_signer(
                    ctx.accounts.stake_program.to_account_info(),
                    stake::Split {
                        stake: ctx.accounts.source_stake.to_account_info(),
                        split_stake: split_stake.to_account_info(),
                        authority: ctx.accounts.pool_authority.to_account_info(),
                        system_program: ctx.accounts.system_program.to_account_info(),
                    },
                    &[&pool_authority_seeds],
                ),
                amount,
            )?;
            split_stake.to_account_info()
            // ctx.accounts.source_stake.to_account_info()
        } else {
            ctx.accounts.source_stake.to_account_info()
        };

        unstake_it::unstake(CpiContext::new_with_signer(
            ctx.accounts.unstake_it_program.to_account_info(),
            unstake_it::Unstake {
                payer: ctx.accounts.authority.to_account_info(),
                unstaker: ctx.accounts.pool_authority.to_account_info(),
                stake_account,
                destination: ctx.accounts.user_wallet.to_account_info(),
                pool_account: ctx.accounts.pool_account.to_account_info(),
                pool_sol_reserves: ctx.accounts.sol_reserves.to_account_info(),
                fee_account: ctx.accounts.fee_account.to_account_info(),
                stake_account_record_account: ctx.accounts.stake_account_record.to_account_info(),
                protocol_fee_account: ctx.accounts.protocol_fee.to_account_info(),
                protocol_fee_destination: ctx.accounts.protocol_fee_destination.to_account_info(),
                clock: ctx.accounts.clock.to_account_info(),
                stake_program: ctx.accounts.stake_program.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
            &[&pool_authority_seeds],
        ))?;
    } else {
        if collateral.source_stake != ctx.accounts.source_stake.key() {
            return Err(ErrorCode::InvalidToken.into());
        }

        let stake_pool = ctx.remaining_accounts.get(0).expect("Expect #0 account");
        let stake_pool_withdraw_authority = ctx.remaining_accounts.get(1).expect("Expect #1 account");
        let reserve_stake_account = ctx.remaining_accounts.get(2).expect("Expect #2 account");
        let manager_fee_account = ctx.remaining_accounts.get(3).expect("Expect #3 account");
        let stake_history = ctx.remaining_accounts.get(4).expect("Expect #4 account");

        let ix = withdraw_sol(
            &id(),
            stake_pool.key,
            stake_pool_withdraw_authority.key,
            ctx.accounts.pool_authority.key,
            ctx.accounts.pool_authority.key,
            reserve_stake_account.key,
            ctx.accounts.user_wallet.key,
            manager_fee_account.key,
            ctx.accounts.source_stake.key,
            ctx.accounts.token_program.key,
            amount,
        );

        let account_infos = vec![
            stake_pool.to_account_info(),
            stake_pool_withdraw_authority.to_account_info(),
            ctx.accounts.pool_authority.to_account_info(),
            ctx.accounts.pool_authority.to_account_info(),
            reserve_stake_account.to_account_info(),
            ctx.accounts.user_wallet.to_account_info(),
            manager_fee_account.to_account_info(),
            ctx.accounts.source_stake.to_account_info(),
            ctx.accounts.clock.to_account_info(),
            stake_history.to_account_info(),
            ctx.accounts.stake_program.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
        ];

        if let Err(_) = invoke_signed(&ix, &account_infos, &[&pool_authority_seeds]) {
            let validator_list_storage = ctx.remaining_accounts.get(5).expect("Expect #5 account");
            let stake_to_split = ctx.remaining_accounts.get(6).expect("Expect #6 account");
            let stake_to_receive = ctx.remaining_accounts.get(7).expect("Expect #7 account");
            let pool_token_account = ctx.remaining_accounts.get(8).expect("Expect #8 account");

            let ix = withdraw_stake(
                &id(),
                stake_pool.key,
                validator_list_storage.key,
                stake_pool_withdraw_authority.key,
                stake_to_split.key,
                stake_to_receive.key,
                ctx.accounts.pool_authority.key,
                ctx.accounts.pool_authority.key,
                pool_token_account.key,
                manager_fee_account.key,
                ctx.accounts.source_stake.key,
                ctx.accounts.token_program.key,
                amount,
            );

            let account_infos = vec![
                stake_pool.to_account_info(),
                validator_list_storage.to_account_info(),
                stake_pool_withdraw_authority.to_account_info(),
                stake_to_split.to_account_info(),
                stake_to_receive.to_account_info(),
                ctx.accounts.pool_authority.to_account_info(),
                ctx.accounts.pool_authority.to_account_info(),
                pool_token_account.to_account_info(),
                manager_fee_account.to_account_info(),
                ctx.accounts.source_stake.to_account_info(),
                ctx.accounts.clock.to_account_info(),
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.stake_program.to_account_info(),
            ];

            invoke_signed(&ix, &account_infos, &[&pool_authority_seeds])?;

            unstake_it::unstake(CpiContext::new_with_signer(
                ctx.accounts.unstake_it_program.to_account_info(),
                unstake_it::Unstake {
                    payer: ctx.accounts.authority.to_account_info(),
                    unstaker: ctx.accounts.pool_authority.to_account_info(),
                    stake_account: stake_to_receive.to_account_info(),
                    destination: ctx.accounts.user_wallet.to_account_info(),
                    pool_account: ctx.accounts.pool_account.to_account_info(),
                    pool_sol_reserves: ctx.accounts.sol_reserves.to_account_info(),
                    fee_account: ctx.accounts.fee_account.to_account_info(),
                    stake_account_record_account: ctx.accounts.stake_account_record.to_account_info(),
                    protocol_fee_account: ctx.accounts.protocol_fee.to_account_info(),
                    protocol_fee_destination: ctx.accounts.protocol_fee_destination.to_account_info(),
                    clock: ctx.accounts.clock.to_account_info(),
                    stake_program: ctx.accounts.stake_program.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                },
                &[&pool_authority_seeds],
            ))?;
        }
    }

    collateral.liquidated_amount += amount;
    withdraw_info.amount -= amount;

    if withdraw_info.amount == 0 {
        // close the withdraw_info account
        utils::close(
            withdraw_info.to_account_info(),
            ctx.accounts.user_wallet.to_account_info(),
        )?;

        user.requests_amount -= 1;
    }

    pool.deposit_amount = pool
        .deposit_amount
        .checked_sub(amount)
        .ok_or(ErrorCode::InsufficientAmount)?;

    if collateral.delegation_stake == collateral.liquidated_amount && collateral.amount == collateral.delegation_stake {
        // close the collateral account
        utils::close(
            collateral.to_account_info(),
            ctx.accounts.collateral_owner_wallet.to_account_info(),
        )?;
    }

    emit!(LiquidationEvent {
        pool: pool.key(),
        authority: ctx.accounts.authority.key(),
        collateral: collateral.key(),
        amount,
        rest_amount: rest_amount - amount,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct LiquidateCollateral<'info> {
    #[account(mut, address = collateral.pool)]
    pub pool: Box<Account<'info, Pool>>,

    /// CHECK: no needs to check, only for signing
    #[account(seeds = [pool.key().as_ref()], bump = pool.authority_bump)]
    pub pool_authority: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [
            Collateral::SEED,
            collateral_owner.key().as_ref(),
            source_stake.key().as_ref()
        ],
        bump,
    )]
    pub collateral: Account<'info, Collateral>,

    #[account(
        mut,
        seeds = [User::SEED, collateral_owner_wallet.key().as_ref()],
        bump,
    )]
    pub collateral_owner: Box<Account<'info, User>>,

    /// CHECK:
    #[account(mut)]
    pub collateral_owner_wallet: AccountInfo<'info>,

    /// CHECK:
    #[account(mut, address = withdraw_info.authority)]
    pub user_wallet: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [User::SEED, user_wallet.key().as_ref()],
        bump,
    )]
    pub user: Box<Account<'info, User>>,

    #[account(
        mut,
        seeds = [
            WithdrawInfo::SEED,
            user_wallet.key().as_ref(),
            user.get_index().to_le_bytes().as_ref(),
        ],
        bump,
    )]
    pub withdraw_info: Box<Account<'info, WithdrawInfo>>,

    #[account(mut, address = pool.oracle)]
    pub oracle: Box<Account<'info, Oracle>>,

    /// CHECK: Address of lp token or stake account
    #[account(mut)]
    pub source_stake: AccountInfo<'info>,

    #[account(
        seeds = [Liquidator::SEED, authority.key().as_ref()],
        bump,
    )]
    pub liquidator: Box<Account<'info, Liquidator>>,

    /// CHECK: Unstake.it pool account
    #[account(mut)]
    pub pool_account: AccountInfo<'info>,

    /// CHECK: Unstake.it SOL reserves account
    #[account(mut)]
    pub sol_reserves: AccountInfo<'info>,

    /// CHECK: Unstake.it fee account
    pub protocol_fee: AccountInfo<'info>,

    /// CHECK: Unstake.it fee destination account
    #[account(mut)]
    pub protocol_fee_destination: AccountInfo<'info>,

    /// CHECK: Unstake.it fee destination account
    pub fee_account: AccountInfo<'info>,

    /// CHECK: Unstake.it fee destination account
    #[account(mut)]
    pub stake_account_record: AccountInfo<'info>,

    /// CHECK: Unstake.it program
    pub unstake_it_program: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub clock: Sysvar<'info, Clock>,
    pub token_program: Program<'info, token::Token>,
    pub stake_program: Program<'info, stake::Stake>,
    pub system_program: Program<'info, System>,
}
