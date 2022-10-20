use crate::*;

#[event]
pub struct DepositStakeEvent {
    #[index]
    pub pool: Pubkey,
    #[index]
    pub pledge: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct WithdrawEvent {
    #[index]
    pub pool: Pubkey,
    #[index]
    pub pledge: Pubkey,
    pub amount: u64,
    pub rest_amount: u64,
    pub timestamp: i64,
}
