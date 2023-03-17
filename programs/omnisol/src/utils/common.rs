use std::{
    io::{Cursor, Write},
    ops::DerefMut,
};

use anchor_lang::{
    error, error::ErrorCode, solana_program::account_info::AccountInfo, Result, __private::CLOSED_ACCOUNT_DISCRIMINATOR,
};

pub fn close<'info>(info: AccountInfo<'info>, sol_destination: AccountInfo<'info>) -> Result<()> {
    // Transfer lamports from the account to the sol_destination.
    let dest_starting_lamports = sol_destination.lamports();
    **sol_destination.lamports.borrow_mut() = dest_starting_lamports.checked_add(info.lamports()).unwrap();
    **info.lamports.borrow_mut() = 0;

    // Clean account data
    let mut data = info.try_borrow_mut_data()?;
    for byte in data.deref_mut().iter_mut() {
        *byte = 0;
    }

    // Mark the account discriminator as closed.
    let dst: &mut [u8] = &mut data;
    let mut cursor = Cursor::new(dst);
    cursor
        .write_all(&CLOSED_ACCOUNT_DISCRIMINATOR)
        .map_err(|_| error!(ErrorCode::AccountDidNotSerialize))
}
