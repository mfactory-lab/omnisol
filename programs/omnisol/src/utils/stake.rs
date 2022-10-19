use anchor_lang::{
    prelude::*,
    solana_program,
    solana_program::{
        program::{invoke, invoke_signed},
        stake::{
            state::StakeAuthorize,
            {self as stake_program},
        },
    },
};

pub struct SplitStakeAccounts<'a, 'b> {
    pub source_stake_account: &'a AccountInfo<'b>,
    pub destination_stake_account: &'a AccountInfo<'b>,
    pub authority: &'a AccountInfo<'b>,
    pub system_program: &'a AccountInfo<'b>,
    pub stake_program: &'a AccountInfo<'b>,
}

/// Splits `amount` from the stake in `accounts.source_stake_account`
/// to the stake in `accounts.destination_stake_account`.
///
/// Issue 3 transactions with `invoke_signed` signed with seeds specified by `seeds`:
///   - Allocates space in the `accounts.destination_stake_account`.
///   - Assigns the owner of the `accounts.destination_stake_account` to the stake program.
///   - Splits the stake.
pub fn split_stake_account(accounts: &SplitStakeAccounts, amount: u64, seeds: &[&[&[u8]]]) -> Result<()> {
    // The Split instruction returns three instructions:
    //   0 - Allocate instruction.
    //   1 - Assign owner instruction.
    //   2 - Split stake instruction.
    let split_instructions = solana_program::stake::instruction::split(
        accounts.source_stake_account.key,
        accounts.authority.key,
        amount,
        accounts.destination_stake_account.key,
    );
    assert_eq!(split_instructions.len(), 3);

    let (allocate_instruction, assign_instruction, split_instruction) =
        (&split_instructions[0], &split_instructions[1], &split_instructions[2]);

    invoke_signed(
        allocate_instruction,
        &[
            accounts.destination_stake_account.clone(),
            accounts.system_program.clone(),
        ],
        seeds,
    )?;

    invoke_signed(
        assign_instruction,
        &[
            accounts.destination_stake_account.clone(),
            accounts.system_program.clone(),
        ],
        seeds,
    )?;

    invoke_signed(
        split_instruction,
        &[
            accounts.source_stake_account.clone(),
            accounts.destination_stake_account.clone(),
            accounts.authority.clone(),
            accounts.stake_program.clone(),
        ],
        seeds,
    )?;
    Ok(())
}

pub struct TransferStakeAuthorityAccounts<'a, 'b> {
    pub destination_stake_account: &'a AccountInfo<'b>,
    pub stake_authority: &'a AccountInfo<'b>,
    pub new_stake_authority: &'a AccountInfo<'b>,
    pub sysvar_clock: &'a AccountInfo<'b>,
    pub authority: &'a AccountInfo<'b>,
    pub system_program: &'a AccountInfo<'b>,
    pub stake_program: &'a AccountInfo<'b>,
}

/// Set the stake and withdraw authority of the destination stake account to the
/// user’s pubkey.
pub fn transfer_stake_authority(accounts: &TransferStakeAuthorityAccounts, seeds: &[&[&[u8]]]) -> Result<()> {
    invoke_signed(
        &solana_program::stake::instruction::authorize(
            accounts.destination_stake_account.key,
            accounts.stake_authority.key,
            accounts.new_stake_authority.key,
            StakeAuthorize::Withdrawer,
            None,
        ),
        &[
            accounts.destination_stake_account.to_account_info(),
            accounts.sysvar_clock.to_account_info(),
            accounts.stake_authority.to_account_info(),
            accounts.stake_program.to_account_info(),
        ],
        seeds,
    )?;

    invoke_signed(
        &solana_program::stake::instruction::authorize(
            accounts.destination_stake_account.key,
            accounts.stake_authority.key,
            accounts.new_stake_authority.key,
            StakeAuthorize::Staker,
            None,
        ),
        &[
            accounts.destination_stake_account.to_account_info(),
            accounts.sysvar_clock.to_account_info(),
            accounts.stake_authority.to_account_info(),
            accounts.stake_program.to_account_info(),
        ],
        seeds,
    )?;

    Ok(())
}

/// Call the stake program to initialize the account, but do not yet delegate it.
pub fn initialize_stake_account_undelegated<'a>(
    stake_authority: &Pubkey,
    stake_account: &AccountInfo<'a>,
    sysvar_rent: &AccountInfo<'a>,
    stake_program: &AccountInfo<'a>,
) -> Result<()> {
    invoke(
        &stake_program::instruction::initialize(
            stake_account.key,
            &stake_program::state::Authorized {
                staker: *stake_authority,
                withdrawer: *stake_authority,
            },
            &stake_program::state::Lockup::default(),
        ),
        &[stake_account.clone(), sysvar_rent.clone(), stake_program.clone()],
    )?;
    Ok(())
}
