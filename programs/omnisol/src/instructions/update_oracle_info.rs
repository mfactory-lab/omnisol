use anchor_lang::prelude::*;

use crate::{
    state::{Oracle, QueueMember},
    ErrorCode,
};

/// The oracle can update priority queue data.
/// It does it by the special algorithm off-chain and save update by this instruction.
pub fn handle(ctx: Context<UpdateOracleInfo>, addresses: Vec<Pubkey>, values: Vec<u64>, clear: bool) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle;

    if addresses.is_empty() || values.is_empty() || addresses.len() != values.len() {
        return Err(ErrorCode::WrongData.into());
    }

    if clear {
        oracle.priority_queue = vec![];
    }

    for (collateral, amount) in addresses.into_iter().zip(values.into_iter()) {
        let queue_member = QueueMember { collateral, amount };
        oracle.priority_queue.push(queue_member);
    }

    Ok(())
}

#[derive(Accounts)]
pub struct UpdateOracleInfo<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [Oracle::SEED],
        bump,
        has_one = authority
    )]
    pub oracle: Box<Account<'info, Oracle>>,

    pub system_program: Program<'info, System>,
}
