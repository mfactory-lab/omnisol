mod state;
mod events;
mod instructions;

use anchor_lang::prelude::*;

declare_id!("36V9V9myUXLDC6vvGKkRjwXGMbjfUGJrSQ85Xhx87q1n");

#[program]
pub mod omnisol {
    use super::*;

    // pub fn init(ctx: Context<instructions::init::Init>) -> Result<()> {
    //     instructions::init::handler(ctx)
    // }
}

// #[error_code]
// pub enum ErrorCode {}
