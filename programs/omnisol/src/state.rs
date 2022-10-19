use anchor_lang::prelude::*;

#[account]
pub struct Pool {
    /// An account with authority that can manage and close the pool.
    pub authority: Pubkey,
    /// Mint of the [Pool]
    pub token_mint: Pubkey,
    /// Creation date
    pub created_at: u64,
    /// Signer bump seed for deriving PDA seeds
    pub authority_bump: u8,
    /// Bump seed for deriving PDA seeds.
    pub bump: u8,
}

#[account]
pub struct Staker {
    /// Authority of stake
    pub authority: Pubkey,
    /// The [Pool] of the stake
    pub pool: Pubkey,
    /// [Stake] account
    pub stake: Pubkey,
    /// Amount of the stake in lamports
    pub amount: u64,
    /// Creation date
    pub created_at: i64,
    /// Bump seed for deriving PDA seeds.
    pub bump: u8,
}
