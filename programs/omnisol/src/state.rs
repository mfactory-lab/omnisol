use anchor_lang::prelude::*;

#[account]
pub struct Pool {
    /// Pool tokens are issued when assets are deposited.
    pub pool_mint: Pubkey,
    /// An account with authority that can manage and close the pool.
    pub authority: Pubkey,
    /// Total stake in deposit
    pub deposit_amount: u64,
    /// Signer bump seed for deriving PDA seeds
    pub authority_bump: u8,
}

impl Pool {
    pub const SIZE: usize = 32 + 32 + 8 + 1;
}

#[account]
pub struct Collateral {
    pub authority: Pubkey,
    pub pool: Pubkey,
    pub source_stake: Pubkey,
    pub split_stake: Pubkey,
    pub delegation_stake: u64,
    pub amount: u64,
    pub created_at: i64,
    pub bump: u8,
}

impl Collateral {
    pub const SEED: &'static [u8] = b"collateral";
    pub const SIZE: usize = 32 + 32 + 32 + 32 + 8 + 8 + 8 + 1;
}
