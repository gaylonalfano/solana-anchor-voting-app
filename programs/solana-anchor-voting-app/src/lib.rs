use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;

declare_id!("7vScxaW7QhPJ4szzcZ7tafjwVya7b5VFKWvANgqeU5EJ");

#[program]
pub mod solana_anchor_voting_app {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
