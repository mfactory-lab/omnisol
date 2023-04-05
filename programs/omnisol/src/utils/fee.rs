use anchor_lang::prelude::*;
use crate::ErrorCode;

pub fn get_storage_fee(storage_fee: u64, epoch: u64, creation_epoch: u64, amount: u64) -> u64 {
    let stored_in_epochs = epoch.saturating_sub(creation_epoch);
    let mut delegation = amount;
    let mut fee: u64 = 0;

    for _ in 0..stored_in_epochs {
        let current_epoch_fee = delegation.saturating_div(1000).saturating_mul(storage_fee);
        fee = fee.saturating_add(current_epoch_fee);
        delegation = delegation.saturating_sub(current_epoch_fee);
    }

    fee
}

pub fn check_fee(fee: u16) -> Result<()> {
    if fee > 1000 {
        msg!("Invalid fee value");
        return Err(ErrorCode::WrongData.into());
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_priority_queue() {
        // Input params
        let storage_fee = 10; // 1%
        let epoch = 3;
        let creation_epoch = 1;
        let amount = 1000000000; // 1 SOL

        // First iteration
        let fee1 = amount / 1000 * storage_fee; // 1% of 1 SOL

        // Second iteration
        let fee2 = (amount - fee1) / 1000 * storage_fee; // 1% of 0.99 SOL

        let result = fee1 + fee2; // sum of all iterations' fees

        assert_eq!(get_storage_fee(storage_fee, epoch, creation_epoch, amount), result);
    }
}
