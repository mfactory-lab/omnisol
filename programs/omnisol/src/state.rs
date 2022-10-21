use anchor_lang::prelude::*;

#[account]
pub struct Pool {
    /// Pool tokens are issued when assets are deposited.
    pub pool_mint: Pubkey,
    /// An account with authority that can manage and close the pool.
    pub authority: Pubkey,
    pub deposit_count: u64,
    pub withdraw_count: u64,
    /// Signer bump seed for deriving PDA seeds
    pub authority_bump: u8,
}

impl Pool {
    pub const SIZE: usize = 32 + 32 + 8 + 8 + 1;
}

#[account]
pub struct Pledge {
    pub authority: Pubkey,
    pub pool: Pubkey,
    pub source_stake: Pubkey,
    pub split_stake: Pubkey,
    pub stake_delegation: u64,
    pub amount: u64,
    pub created_at: i64,
    pub bump: u8,
}

impl Pledge {
    pub const SEED: &'static [u8] = b"pledge";
    pub const SIZE: usize = 32 + 32 + 32 + 32 + 8 + 8 + 8 + 1;
}

#[account]
pub struct Withdrawal {
    pub id: u64,
    pub authority: Pubkey,
    pub amount: u64,
    pub bump: u8,
}

impl Withdrawal {
    pub const SEED: &'static [u8] = b"withdrawal";
    pub const SIZE: usize = 8 + 32 + 8 + 1;
}
