#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("6XeRbsLezt9HC8BzvczsTZFZ4CuZtT1j4ujwWhr34JMo");

#[program]
pub mod votingdapp {

    use super::*;
    pub fn initialize_poll(
        ctx: Context<InitializePoll>,
        poll_id: u64,
        description: String,
        poll_start: u64,
        poll_end: u64,
    ) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        poll.poll_id = poll_id;
        poll.description = description;
        poll.poll_start = poll_start;
        poll.poll_end = poll_end;

        Ok(())
    }

    pub fn initialize_candidate(
        ctx: Context<InitializeCandidate>,
        candidate_name: String,
        _poll_id: u64,
    ) -> Result<()> {
        let candidate = &mut ctx.accounts.candidate;
        candidate.candidate_name = candidate_name;
        ctx.accounts.poll.poll_option_index += 1;

        Ok(())
    }
    pub fn vote(ctx: Context<Vote>, _candidate_name: String, _poll_id: u64) -> Result<()> {
        let candidate_account = &mut ctx.accounts.candidate;

        let poll = &mut ctx.accounts.poll;
        let current_time = Clock::get()?.unix_timestamp;
        if current_time < poll.poll_start as i64 {
            return Err(ErrorCode::PollNotStarted.into());
        }
        if current_time > poll.poll_end as i64 {
            return Err(ErrorCode::PollEnded.into());
        }
        candidate_account.candidate_votes += 1;
        Ok(())
    }
}
#[derive(Accounts)]
#[instruction(poll_id:u64)]
pub struct InitializePoll<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(init,payer=signer,space=8+Poll::INIT_SPACE,seeds=[poll_id.to_le_bytes().as_ref()],bump)]
    pub poll: Account<'info, Poll>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(candidate_name:String,poll_id:u64)]
pub struct InitializeCandidate<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(seeds=[poll_id.to_le_bytes().as_ref()],bump)]
    pub poll: Account<'info, Poll>,
    #[account(init,payer=signer,space=8+Candidate::INIT_SPACE,seeds=[poll_id.to_le_bytes().as_ref(),candidate_name.as_ref()],bump)]
    pub candidate: Account<'info, Candidate>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(candidate_name:String,poll_id:u64)]
pub struct Vote<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,
    // candidate PDA seed order must match InitializeCandidate (poll_id, candidate_name)
    #[account(mut, seeds=[poll_id.to_le_bytes().as_ref(), candidate_name.as_ref()],bump)]
    pub candidate: Account<'info, Candidate>,
    #[account(seeds=[poll_id.to_le_bytes().as_ref()],bump)]
    pub poll: Account<'info, Poll>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Candidate {
    #[max_len(32)]
    pub candidate_name: String,
    pub candidate_votes: u64,
}
#[account]
#[derive(InitSpace)]
pub struct Poll {
    pub poll_id: u64,
    #[max_len(280)]
    pub description: String,
    pub poll_start: u64,
    pub poll_end: u64,
    pub poll_option_index: u64,
}
#[error_code]
enum ErrorCode {
    PollNotStarted,
    PollEnded,
}
