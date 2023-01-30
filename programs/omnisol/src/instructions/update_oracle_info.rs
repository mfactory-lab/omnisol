use anchor_lang::prelude::*;

use crate::{state::Pool, ErrorCode};
use crate::state::{Oracle, QueueMember};

pub fn handle(ctx: Context<UpdateOracleInfo>, addresses: Vec<Pubkey>, values: Vec<u64>) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle;

    if addresses.is_empty()
        || values.is_empty()
        || addresses.len() != values.len() {
        return Err(ErrorCode::WrongData.into());
    }

    for i in 0..addresses.len() {
        let collateral = *addresses.get(i).unwrap();
        let amount = *values.get(i).unwrap();
        let queue_member = QueueMember {collateral, amount};
        oracle.priority_queue.push(queue_member);
    }

    Ok(())
}

#[derive(Accounts)]
pub struct UpdateOracleInfo<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut, has_one = authority)]
    pub oracle: Box<Account<'info, Oracle>>,

    pub system_program: Program<'info, System>,
}
