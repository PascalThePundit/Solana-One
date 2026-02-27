use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod identity_registry {
    use super::*;

    /// Stage 14: Register a new identity with a unique handle.
    pub fn register_identity(ctx: Context<RegisterIdentity>, handle: String) -> Result<()> {
        require!(
            handle.len() >= 3 && handle.len() <= 32,
            IdentityError::InvalidHandleLength
        );

        let identity = &mut ctx.accounts.identity_account;
        identity.authority = ctx.accounts.authority.key();
        identity.handle = handle;
        identity.created_at = Clock::get()?.unix_timestamp;

        Ok(())
    }

    /// Stage 14: Update the identity handle.
    pub fn update_handle(ctx: Context<UpdateHandle>, new_handle: String) -> Result<()> {
        require!(
            new_handle.len() >= 3 && new_handle.len() <= 32,
            IdentityError::InvalidHandleLength
        );

        let identity = &mut ctx.accounts.identity_account;
        identity.handle = new_handle;

        Ok(())
    }

    /// Stage 15: Initialize the score account for an existing identity.
    pub fn initialize_score(ctx: Context<InitializeScore>) -> Result<()> {
        let score_account = &mut ctx.accounts.identity_score_account;
        
        score_account.authority = ctx.accounts.authority.key();
        score_account.identity_score = 0;
        score_account.risk_level = 0;
        score_account.tx_count = 0;
        score_account.last_updated = Clock::get()?.unix_timestamp;

        Ok(())
    }

    /// Stage 15: Update the identity score and risk level.
    pub fn update_score(
        ctx: Context<UpdateScore>, 
        new_score: u64, 
        new_risk: u8, 
        new_tx_count: u64
    ) -> Result<()> {
        require!(new_risk <= 5, IdentityError::InvalidRiskLevel);

        let score_account = &mut ctx.accounts.identity_score_account;
        score_account.identity_score = new_score;
        score_account.risk_level = new_risk;
        score_account.tx_count = new_tx_count;
        score_account.last_updated = Clock::get()?.unix_timestamp;

        Ok(())
    }
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

#[derive(Accounts)]
pub struct RegisterIdentity<'info> {
    #[account(
        init,
        payer = authority,
        space = IdentityAccount::SPACE,
        seeds = [b"identity", authority.key().as_ref()],
        bump,
    )]
    pub identity_account: Account<'info, IdentityAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateHandle<'info> {
    #[account(
        mut,
        seeds = [b"identity", authority.key().as_ref()],
        bump,
        has_one = authority @ IdentityError::Unauthorized,
    )]
    pub identity_account: Account<'info, IdentityAccount>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitializeScore<'info> {
    #[account(
        init,
        payer = authority,
        space = IdentityScoreAccount::SPACE,
        seeds = [b"score", authority.key().as_ref()],
        bump,
    )]
    pub identity_score_account: Account<'info, IdentityScoreAccount>,

    #[account(
        seeds = [b"identity", authority.key().as_ref()],
        bump,
        constraint = identity_account.authority == authority.key() @ IdentityError::IdentityNotFound
    )]
    pub identity_account: Account<'info, IdentityAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateScore<'info> {
    #[account(
        mut,
        seeds = [b"score", authority.key().as_ref()],
        bump,
        has_one = authority @ IdentityError::Unauthorized,
    )]
    pub identity_score_account: Account<'info, IdentityScoreAccount>,

    pub authority: Signer<'info>,
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

#[account]
pub struct IdentityAccount {
    pub authority: Pubkey,
    pub handle: String,
    pub created_at: i64,
}

impl IdentityAccount {
    pub const SPACE: usize = 8 + 32 + (4 + 32) + 8;
}

#[account]
pub struct IdentityScoreAccount {
    pub authority: Pubkey,
    pub identity_score: u64,
    pub risk_level: u8,
    pub tx_count: u64,
    pub last_updated: i64,
}

impl IdentityScoreAccount {
    pub const SPACE: usize = 8 + 32 + 8 + 1 + 8 + 8;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

#[error_code]
pub enum IdentityError {
    #[msg("An identity already exists for this wallet.")]
    IdentityAlreadyExists,

    #[msg("Handle must be between 3 and 32 characters.")]
    InvalidHandleLength,

    #[msg("You are not authorized to perform this action.")]
    Unauthorized,

    #[msg("A score account already exists for this wallet.")]
    ScoreAlreadyExists,

    #[msg("Risk level must be between 0 and 5.")]
    InvalidRiskLevel,

    #[msg("Identity account not found. Please register first.")]
    IdentityNotFound,
}
