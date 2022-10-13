use anchor_lang::prelude::*;
use anchor_spl::token::Token;

pub fn handler(ctx: Context<Init>) -> Result<()> {
    todo!();
}

#[derive(Accounts)]
pub struct Init<'info> {
    /// CHECK:
    #[account(mut)]
    pub authority: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
