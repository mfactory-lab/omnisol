pub fn get_storage_fee(storage_fee: u64, epoch: u64, creation_epoch: u64, delegation_stake: u64) -> u64 {
    let stored_in_epochs = epoch.saturating_sub(creation_epoch);
    let mut delegation = delegation_stake;
    let mut fee: u64 = 0;

    for _ in 0..stored_in_epochs {
        let current_epoch_fee = delegation.saturating_div(100).saturating_mul(storage_fee);
        fee = fee.saturating_add(current_epoch_fee);
        delegation = delegation.saturating_sub(current_epoch_fee);
    }

    fee
}
