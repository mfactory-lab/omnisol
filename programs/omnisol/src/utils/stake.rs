use std::ops::Deref;

use anchor_lang::{
    context::CpiContext,
    solana_program::{
        self,
        account_info::AccountInfo,
        pubkey::Pubkey,
        stake::{
            self,
            program::ID,
            state::{StakeAuthorize, StakeState},
        },
    },
    Accounts, AnchorDeserialize, Result, ToAccountInfo,
};

// CPI functions

pub fn initialize<'info>(ctx: CpiContext<'_, '_, '_, 'info, Initialize<'info>>, authority: &Pubkey) -> Result<()> {
    let ix = stake::instruction::initialize(
        ctx.accounts.stake.key,
        &stake::state::Authorized {
            staker: *authority,
            withdrawer: *authority,
        },
        &stake::state::Lockup::default(),
    );
    solana_program::program::invoke_signed(&ix, &[ctx.accounts.stake, ctx.accounts.sysvar_rent], ctx.signer_seeds)
        .map_err(Into::into)
}

pub fn authorize<'info>(
    ctx: CpiContext<'_, '_, '_, 'info, Authorize<'info>>,
    stake_authorize: StakeAuthorize,
    custodian: Option<AccountInfo<'info>>,
) -> Result<()> {
    let ix = stake::instruction::authorize(
        ctx.accounts.stake.key,
        ctx.accounts.authority.key,
        ctx.accounts.new_authority.key,
        stake_authorize,
        custodian.as_ref().map(|c| c.key),
    );
    let mut account_infos = vec![ctx.accounts.stake, ctx.accounts.clock, ctx.accounts.authority];
    if let Some(c) = custodian {
        account_infos.push(c);
    }
    solana_program::program::invoke_signed(&ix, &account_infos, ctx.signer_seeds).map_err(Into::into)
}

pub fn withdraw<'info>(
    ctx: CpiContext<'_, '_, '_, 'info, Withdraw<'info>>,
    amount: u64,
    custodian: Option<AccountInfo<'info>>,
) -> Result<()> {
    let ix = stake::instruction::withdraw(
        ctx.accounts.stake.key,
        ctx.accounts.withdrawer.key,
        ctx.accounts.to.key,
        amount,
        custodian.as_ref().map(|c| c.key),
    );
    let mut account_infos = vec![
        ctx.accounts.stake,
        ctx.accounts.to,
        ctx.accounts.clock,
        ctx.accounts.stake_history,
        ctx.accounts.withdrawer,
    ];
    if let Some(c) = custodian {
        account_infos.push(c);
    }
    solana_program::program::invoke_signed(&ix, &account_infos, ctx.signer_seeds).map_err(Into::into)
}

pub fn deactivate_stake<'info>(ctx: CpiContext<'_, '_, '_, 'info, DeactivateStake<'info>>) -> Result<()> {
    let ix = stake::instruction::deactivate_stake(ctx.accounts.stake.key, ctx.accounts.staker.key);
    solana_program::program::invoke_signed(
        &ix,
        &[ctx.accounts.stake, ctx.accounts.clock, ctx.accounts.staker],
        ctx.signer_seeds,
    )
    .map_err(Into::into)
}

pub fn split<'info>(ctx: CpiContext<'_, '_, '_, 'info, Split<'info>>, amount: u64) -> Result<()> {
    let ixs = stake::instruction::split(
        ctx.accounts.stake.key,
        ctx.accounts.authority.key,
        amount,
        ctx.accounts.split_stake.key,
    );
    assert_eq!(ixs.len(), 3);

    let (allocate_ix, assign_ix, split_ix) = (&ixs[0], &ixs[1], &ixs[2]);

    solana_program::program::invoke_signed(
        allocate_ix,
        &[
            ctx.accounts.split_stake.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
        ctx.signer_seeds,
    )
    .map_err(Into::into)?;

    solana_program::program::invoke_signed(
        assign_ix,
        &[
            ctx.accounts.split_stake.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
        ctx.signer_seeds,
    )
    .map_err(Into::into)?;

    solana_program::program::invoke_signed(
        split_ix,
        &[
            ctx.accounts.stake.to_account_info(),
            ctx.accounts.split_stake.to_account_info(),
            ctx.accounts.authority.to_account_info(),
        ],
        ctx.signer_seeds,
    )
    .map_err(Into::into)?;

    Ok(())
}

pub fn merge<'info>(ctx: CpiContext<'_, '_, '_, 'info, Merge<'info>>) -> Result<()> {
    let ix = stake::instruction::merge(
        ctx.accounts.destination_stake.key,
        ctx.accounts.source_stake.key,
        ctx.accounts.authority.key,
    );
    solana_program::program::invoke_signed(
        &ix.0,
        &[
            ctx.accounts.destination_stake,
            ctx.accounts.source_stake,
            ctx.accounts.authority,
            ctx.accounts.stake_history,
            ctx.accounts.clock,
        ],
        ctx.signer_seeds,
    )
    .map_err(Into::into)
}

// CPI accounts

#[derive(Accounts)]
pub struct Initialize<'info> {
    pub stake: AccountInfo<'info>,
    pub sysvar_rent: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Authorize<'info> {
    pub stake: AccountInfo<'info>,
    pub authority: AccountInfo<'info>,
    pub new_authority: AccountInfo<'info>,
    pub clock: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    pub stake: AccountInfo<'info>,
    pub withdrawer: AccountInfo<'info>,
    pub to: AccountInfo<'info>,
    pub clock: AccountInfo<'info>,
    pub stake_history: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct DeactivateStake<'info> {
    pub stake: AccountInfo<'info>,
    pub staker: AccountInfo<'info>,
    pub clock: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Split<'info> {
    pub stake: AccountInfo<'info>,
    pub split_stake: AccountInfo<'info>,
    pub authority: AccountInfo<'info>,
    pub system_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Merge<'info> {
    pub destination_stake: AccountInfo<'info>,
    pub source_stake: AccountInfo<'info>,
    pub authority: AccountInfo<'info>,
    pub stake_history: AccountInfo<'info>,
    pub clock: AccountInfo<'info>,
    pub system_program: AccountInfo<'info>,
}

// State

#[derive(Clone)]
pub struct StakeAccount(StakeState);

impl anchor_lang::AccountDeserialize for StakeAccount {
    fn try_deserialize(buf: &mut &[u8]) -> Result<Self> {
        Self::try_deserialize_unchecked(buf)
    }

    fn try_deserialize_unchecked(buf: &mut &[u8]) -> Result<Self> {
        StakeState::deserialize(buf).map(Self).map_err(Into::into)
    }
}

impl anchor_lang::AccountSerialize for StakeAccount {}

impl anchor_lang::Owner for StakeAccount {
    fn owner() -> Pubkey {
        ID
    }
}

impl Deref for StakeAccount {
    type Target = StakeState;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[derive(Clone)]
pub struct Stake;

impl anchor_lang::Id for Stake {
    fn id() -> Pubkey {
        ID
    }
}
