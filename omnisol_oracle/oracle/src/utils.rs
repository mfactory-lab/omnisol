use arrayref::{array_ref, array_refs};
use clap::Parser;
use solana_sdk::{program_error::ProgramError, pubkey::Pubkey};

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
pub struct Args {
    /// Path to private key
    #[arg(short, long)]
    pub sign: String,

    /// Solana cluster name
    #[arg(short, long)]
    pub cluster: String,

    /// Oracle address
    #[arg(short, long)]
    pub oracle: String,
}

pub const PRIORITY_QUEUE_LENGTH: usize = 255;
pub const USER_SIZE: u64 = 57;
pub const COLLATERAL_SIZE: u64 = 138;

pub struct User {
    pub rate: u64,
}

impl User {
    pub fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        let src = array_ref![src, 0, USER_SIZE as usize];
        let (_, _, rate, _, _, _) =
            array_refs![src, 8, 32, 8, 1, 4, 4];
        Ok(User {
            rate: u64::from_le_bytes(*rate),
        })
    }
}

pub struct Collateral {
    pub user: Pubkey,
    pub delegation_stake: u64,
    pub liquidated_amount: u64,
}

impl Collateral {
    pub fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        let src = array_ref![src, 0, COLLATERAL_SIZE as usize];
        let (_, user, _, _, delegation_stake, _, liquidated_amount, _, _, _) =
            array_refs![src, 8, 32, 32, 32, 8, 8, 8, 8, 1, 1];
        Ok(Collateral {
            user: Pubkey::new_from_array(*user),
            delegation_stake: u64::from_le_bytes(*delegation_stake),
            liquidated_amount: u64::from_le_bytes(*liquidated_amount),
        })
    }
}
