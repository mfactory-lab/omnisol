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
    /// Flag that indicates that the pool is running or paused
    pub is_active: bool,
}

impl Pool {
    pub const SIZE: usize = 8 + 32 + 32 + 8 + 1 + 1;
}

#[account]
pub struct Collateral {
    /// Authority of the staking pool
    pub authority: Pubkey,
    /// Address of the global pool
    pub pool: Pubkey,
    /// An account of staking pool
    pub source_stake: Pubkey,
    /// An account of splited staking pool
    pub split_stake: Pubkey,
    /// An amount of delegated staked tokens
    pub delegation_stake: u64,
    /// An amount of minted pool tokens
    pub amount: u64,
    /// Time of collateral's creation
    pub created_at: i64,
    /// Signer bump seed for deriving PDA seeds
    pub bump: u8,
}

impl Collateral {
    pub const SEED: &'static [u8] = b"collateral";
    pub const SIZE: usize = 32 + 32 + 32 + 32 + 8 + 8 + 8 + 1;
}
