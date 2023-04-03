use anchor_lang::prelude::*;

pub const ADMIN: &str = "4kMtMnYWFbsMc7M3jcdnfCceHaiXmrqaMz2QZQAmn88i";
pub const MINT_AUTHORITY_SEED: &'static [u8] = b"mint_authority";

#[account]
pub struct Pool {
    /// Pool tokens are issued when assets are deposited.
    pub pool_mint: Pubkey,
    /// An account with authority that can manage and close the pool.
    pub authority: Pubkey,
    /// Oracle address for clarification
    pub oracle: Pubkey,
    /// Address of LP token or native stake program
    /// TODO: rename
    pub stake_source: Pubkey,
    /// Total stake in deposit
    pub deposit_amount: u64,
    /// Signer bump seed for deriving PDA seeds
    pub authority_bump: u8,
    /// Flag that indicates that the pool is running or paused
    pub is_active: bool,
}

impl Pool {
    pub const SIZE: usize = 8 + 32 + 32 + 32 + 32 + 8 + 1 + 1;
}

#[account]
pub struct Oracle {
    /// Oracle wallet that can manage oracle info
    pub authority: Pubkey,
    /// Priority queue with collaterals by users rate in ascending order
    pub priority_queue: Vec<QueueMember>,
}

impl Oracle {
    pub const SIZE: usize = 4068;
    pub const MAX_PRIORITY_QUEUE_LENGTH: usize = 100;
    pub const MAX_BATCH_LENGTH: usize = 25;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct QueueMember {
    pub collateral: Pubkey,
    pub amount: u64,
}

#[account]
pub struct Collateral {
    /// User PDA with wallet that has authority of the staking pool
    pub user: Pubkey,
    /// Address of the global pool
    pub pool: Pubkey,
    /// An account of staking pool or LP token
    /// TODO rename
    pub source_stake: Pubkey,
    /// Delegated stake account (default for LP tokens deposit)
    pub delegated_stake: Pubkey,
    /// An amount of delegated staked tokens
    pub delegation_stake: u64,
    /// An amount of minted pool tokens
    pub amount: u64,
    /// An amount of "liquidated" staked tokens
    pub liquidated_amount: u64,
    /// Time of collateral's creation
    pub created_at: i64,
    /// Signer bump seed for deriving PDA seeds
    pub bump: u8,
    /// Flag that indicates the type of stake (can be LP token account or native staking pool)
    pub is_native: bool,
}

impl Collateral {
    pub fn get_source_stake(&self) -> Pubkey {
        if self.is_native {
            self.source_stake
        } else {
            self.delegated_stake
        }
    }
    pub const SEED: &'static [u8] = b"collateral";
    pub const SIZE: usize = 8 + 32 + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 1 + 1;
}

#[account]
pub struct Whitelist {
    /// Token mint address that is whitelisted to the pool
    pub whitelisted_token: Pubkey,
    /// Global pool address
    pub pool: Pubkey,
    /// LP tokens` pool (default for native stake)
    pub staking_pool: Pubkey,
}

impl Whitelist {
    pub const SEED: &'static [u8] = b"whitelist";
    pub const SIZE: usize = 8 + 32 + 32 + 32;
}

#[account]
pub struct WithdrawInfo {
    /// User that made withdraw request
    pub authority: Pubkey,
    /// Amount of omnisol burnt
    pub amount: u64,
    /// Time of withdraw request creation
    pub created_at: i64,
}

impl WithdrawInfo {
    pub const SEED: &'static [u8] = b"withdraw_info";
    pub const SIZE: usize = 8 + 32 + 8 + 8;
}

#[account]
pub struct Liquidator {
    /// Liquidator authority
    pub authority: Pubkey,
}

impl Liquidator {
    pub const SEED: &'static [u8] = b"liquidator";
    pub const SIZE: usize = 8 + 32;
}

#[account]
pub struct Manager {
    /// Manager wallet address
    pub manager: Pubkey,
}

impl Manager {
    pub const SEED: &'static [u8] = b"manager";
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
    /// Current amount of pending withdraw requests
    pub requests_amount: u32,
    /// Index of last made withdraw request
    pub last_withdraw_index: u32,
}

impl User {
    pub const SEED: &'static [u8] = b"user";
    pub const SIZE: usize = 8 + 32 + 8 + 1 + 4 + 4;
    pub fn get_index(&self) -> u32 {
        self.last_withdraw_index - self.requests_amount + 1
    }
    pub fn next_index(&self) -> u32 {
        self.last_withdraw_index + 1
    }
}
