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
    solana_program::program::invoke_signed(&ix, &account_infos, ctx.signer_seeds).map_err(|error| error.into())
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

pub fn merge<'info>(ctx: CpiContext<'_, '_, '_, 'info, Merge<'info>>) -> Result<()> {
    let ix = stake::instruction::merge(
        ctx.accounts.destination_stake.key,
        ctx.accounts.source_stake.key,
        ctx.accounts.authority.key,
    );
    solana_program::program::invoke_signed(
        &ix.get(0).unwrap(),
        &[
            ctx.accounts.destination_stake,
            ctx.accounts.source_stake,
            ctx.accounts.authority,
            ctx.accounts.stake_history,
            ctx.accounts.clock,
        ],
        ctx.signer_seeds,
    )
    .map_err(|error| error.into())
}

// CPI accounts

#[derive(Accounts)]
pub struct Authorize<'info> {
    /// CHECK:
    pub stake: AccountInfo<'info>,
    /// CHECK:
    pub authority: AccountInfo<'info>,
    /// CHECK:
    pub new_authority: AccountInfo<'info>,
    /// CHECK:
    pub clock: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Split<'info> {
    /// CHECK:
    pub stake: AccountInfo<'info>,
    /// CHECK:
    pub split_stake: AccountInfo<'info>,
    /// CHECK:
    pub authority: AccountInfo<'info>,
    /// CHECK:
    pub system_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Merge<'info> {
    /// CHECK:
    pub destination_stake: AccountInfo<'info>,
    /// CHECK:
    pub source_stake: AccountInfo<'info>,
    /// CHECK:
    pub authority: AccountInfo<'info>,
    /// CHECK:
    pub stake_history: AccountInfo<'info>,
    /// CHECK:
    pub clock: AccountInfo<'info>,
    /// CHECK:
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
        StakeState::deserialize(buf).map(Self).map_err(|error| error.into())
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
