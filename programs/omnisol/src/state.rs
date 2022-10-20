use anchor_lang::prelude::*;

#[account]
pub struct Pool {
    /// Pool tokens are issued when assets are deposited.
    pub pool_mint: Pubkey,
    /// An account with authority that can manage and close the pool.
    pub authority: Pubkey,
    /// Signer bump seed for deriving PDA seeds
    pub authority_bump: u8,
    /// Bump seed for deriving PDA seeds.
    pub bump: u8,
}

impl Pool {
    pub const SIZE: usize = 66; // 32 + 32 + 1 + 1;
}

#[account]
pub struct Pledge {
    pub authority: Pubkey,
    pub pool: Pubkey,
    pub source_stake: Pubkey,
    pub split_stake: Pubkey,
    pub stake_delegation: u64,
    pub amount: u64,
    // pub last_withdraw_amount: u64,
    // pub last_withdraw_at: i64,
    pub created_at: i64,
    /// Bump seed for deriving PDA seeds.
    pub bump: u8,
}

impl Pledge {
    pub const SIZE: usize = 32 + 32 + 32 + 32 + 8 + 8 + 8 + 1;
}
