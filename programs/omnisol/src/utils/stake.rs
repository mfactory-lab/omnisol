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
    )?;

    solana_program::program::invoke_signed(
        assign_ix,
        &[
            ctx.accounts.split_stake.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
        ctx.signer_seeds,
    )?;

    solana_program::program::invoke_signed(
        split_ix,
        &[
            ctx.accounts.stake.to_account_info(),
            ctx.accounts.split_stake.to_account_info(),
            ctx.accounts.authority.to_account_info(),
        ],
        ctx.signer_seeds,
    )?;

    Ok(())
}

// CPI accounts

#[derive(Accounts)]
pub struct Initialize<'info> {
    /// The stake account to be initialized
    pub stake: AccountInfo<'info>,

    /// Rent sysvar
    pub sysvar_rent: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Authorize<'info> {
    /// The stake account to be updated
    pub stake: AccountInfo<'info>,

    /// The existing authority
    pub authority: AccountInfo<'info>,

    /// The new authority to replace the existing authority
    pub new_authority: AccountInfo<'info>,

    /// Clock sysvar
    pub clock: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    /// The stake account to be updated
    pub stake: AccountInfo<'info>,

    /// The stake account's withdraw authority
    pub withdrawer: AccountInfo<'info>,

    /// Account to send withdrawn lamports to
    pub to: AccountInfo<'info>,

    /// Clock sysvar
    pub clock: AccountInfo<'info>,

    /// StakeHistory sysvar
    pub stake_history: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct DeactivateStake<'info> {
    /// The stake account to be deactivated
    pub stake: AccountInfo<'info>,

    /// The stake account's stake authority
    pub staker: AccountInfo<'info>,

    /// Clock sysvar
    pub clock: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Split<'info> {
    /// The stake account to be divided
    pub stake: AccountInfo<'info>,

    /// The split stake account
    pub split_stake: AccountInfo<'info>,

    /// The existing authority
    pub authority: AccountInfo<'info>,

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
