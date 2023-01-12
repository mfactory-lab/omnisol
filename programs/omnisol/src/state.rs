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
    /// User PDA with wallet that has authority of the staking pool
    pub user: Pubkey,
    /// Address of the global pool
    pub pool: Pubkey,
    /// An account of staking pool or LP token
    pub source_stake: Pubkey,
    /// An amount of delegated staked tokens
    pub delegation_stake: u64,
    /// An amount of minted pool tokens
    pub amount: u64,
    /// Time of collateral's creation
    pub created_at: i64,
    /// Signer bump seed for deriving PDA seeds
    pub bump: u8,
    /// Flag that indicates the type of stake (can be LP token account or native staking pool)
    pub is_native: bool,
}

impl Collateral {
    pub const SEED: &'static [u8] = b"collateral";
    pub const SIZE: usize = 8 + 32 + 32 + 32 + 32 + 8 + 8 + 8 + 1;
}

#[account]
pub struct Whitelist {
    /// Token mint address that is whitelisted to the pool
    pub whitelisted_token: Pubkey,
}

impl Whitelist {
    pub const SEED: &'static [u8] = b"whitelist";
    pub const SIZE: usize = 8 + 32;
}

#[account]
pub struct User {
    /// Wallet of registered user
    pub wallet: Pubkey,
    /// Rate value for priority queue
    pub rate: u64,
    /// Flag that indicates that the user is blocked or not
    pub is_blocked: bool,
}

impl User {
    pub const SEED: &'static [u8] = b"user";
    pub const SIZE: usize = 8 + 32 + 8 + 1;
}
