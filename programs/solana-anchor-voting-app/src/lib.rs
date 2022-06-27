use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;



declare_id!("7vScxaW7QhPJ4szzcZ7tafjwVya7b5VFKWvANgqeU5EJ");

#[program]
pub mod solana_anchor_voting_app {
    use super::*;

    // NOTE Any argument that is NOT an account can be passed after context
    pub fn submit_vote(ctx: Context<SubmitVoteInstructionContext>, topic: String, selection: String) -> Result<()> {
    
        // 1. Extract all the accounts we need from ctx
        let vote: &mut Account<Vote> = &mut ctx.accounts.vote;
        // Access user account to save it on the vote account
        let author: &Signer = &ctx.accounts.author;
        // Use Solana's Clock::get() for timestamp on vote
        let clock: Clock = Clock::get().unwrap();

        // 2. Add some data validation guards
        if topic.chars().count() > MAX_TOPIC_CHARS {
            // Return an error
            // NOTE into() coverts our ErrorCode type into w/e is required by
            // the code which here is Err and more precisely ProgramError
            return Err(ErrorCode::TopicTooLong.into())
        } 

        if selection.chars().count() > MAX_CONTENT_CHARS {
            // Return an error
            // NOTE into() coverts our ErrorCode type into w/e is required by
            // the code which here is Err and more precisely ProgramError
            return Err(ErrorCode::ContentTooLong.into())
        }

        // 3. We now have all the data we need to fill the new vote account
        user.author = *author.key;
        user.timestamp = clock.unix_timestamp;
        user.topic = topic;
        user.selection = selection;

        // NOTE At this point we have a working instruction that initializes
        // a new Vote account for us and hydrates/populates it with the right info
        Ok(())
    }
}


// 4. Define the context of Vote instruction for Context<T>
// NOTE By default ctx: Context<Initialize>. We're changing it to SubmitVoteInstruction struct
// NOTE Account<'info, Vote> is from Anchor, which wraps AccountInfo
// and parses the AccountInfo.data (u8[]) according to Vote struct
// NOTE Account Contraints (by Anchor) are like middleware that occur before
// the instruction function e.g. submit_tweet() is being executed
#[derive(Accounts)]
pub struct SubmitVoteInstructionContext<'info> {
    // Ensure account of type Account is signer by using account constraints
    #[account(init, payer = user, space = Vote::LEN)]
    pub vote: Account<'info, Vote>, // account that instruction will create
    // NOTE 'Account' wraps 'AccountInfo' and parses account's data
    // Mark user prop as mutable so we can change their money balance to pay
    #[account(mut)]
    pub user: Signer<'info>, // Submitter of vote. This account signs the instruction
    // Ensure official Solana System Program is used (ie pub key matches system_program::ID)
    // NOTE Add a safety check doc comment: https://book.anchor-lang.com/anchor_in_depth/the_accounts_struct.html?highlight=accounts%20struct%20safety%20checks#safety-checks
    #[account(address = system_program::ID)]
    // NOTE 'AccountInfo' is low-level struct where account's data is unparsed array of bytes
    // UPDATE 6/26: Now there is a Program account type:
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub system_program: Program<'info, System>, // Used to init the Vote account and rent
}



// 1. Define the structure of Vote account
// NOTE We could consider adding another account e.g. UserProfile that
// our 'program' object could also create and then fetch
#[account]
pub struct Vote {
    pub user: Pubkey,
    pub timestamp: i64,
    pub topic: String,
    pub selection: String
}

// 2. Add some useful constants for sizing properties (helps compute rent)
const DISCRIMINATOR_LENGTH: usize = 8; // Stores type of account (Vote, UserProfile, etc)
const USER_PUBLIC_KEY_LENGTH: usize = 32; 
const TIMESTAMP_LENGTH: usize = 8;
const STRING_LENGTH_PREFIX: usize = 4; // Stores the size of the string.
const MAX_TOPIC_LENGTH: usize = 200; // 50 chars max
const MAX_SELECTION_LENGTH: usize = 200; // 50 chars max * 4
const MAX_TOPIC_CHARS: usize = 50;
const MAX_SELECTION_CHARS: usize = 50;

// 3. Add a constant on the Vote account that provides its total size
impl Vote {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + USER_PUBLIC_KEY_LENGTH
        + TIMESTAMP_LENGTH
        + STRING_LENGTH_PREFIX + MAX_TOPIC_LENGTH
        + STRING_LENGTH_PREFIX + MAX_SELECTION_LENGTH;
}
