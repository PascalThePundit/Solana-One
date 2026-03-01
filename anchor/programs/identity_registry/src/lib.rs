use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, MintTo, Token, TokenAccount, FreezeAccount},
    metadata::{
        create_metadata_accounts_v3,
        CreateMetadataAccountsV3,
        mpl_token_metadata::types::DataV2,
    },
};

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
        identity.badge_mint = None;

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

    /// Stage 16: Mint a unique identity badge NFT.
    pub fn mint_identity_badge(ctx: Context<MintIdentityBadge>) -> Result<()> {
        let identity = &mut ctx.accounts.identity_account;
        
        // Security checks
        require!(identity.badge_mint.is_none(), IdentityError::BadgeAlreadyMinted);
        require!(ctx.accounts.identity_score_account.authority == ctx.accounts.authority.key(), IdentityError::Unauthorized);

        // CPI to Mint 1 token
        let cpi_accounts = MintTo {
            mint: ctx.accounts.badge_mint.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::mint_to(cpi_ctx, 1)?;

        // Metadata details
        let metadata_data = DataV2 {
            name: "So1ana Identity Badge".to_string(),
            symbol: "S1ID".to_string(),
            uri: "https://example.com/metadata.json".to_string(),
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        };

        // CPI to Metaplex Create Metadata
        let create_metadata_accounts = CreateMetadataAccountsV3 {
            metadata: ctx.accounts.metadata_account.to_account_info(),
            mint: ctx.accounts.badge_mint.to_account_info(),
            mint_authority: ctx.accounts.authority.to_account_info(),
            payer: ctx.accounts.authority.to_account_info(),
            update_authority: ctx.accounts.authority.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
        };
        
        let metadata_program = ctx.accounts.token_metadata_program.to_account_info();
        let metadata_ctx = CpiContext::new(metadata_program, create_metadata_accounts);
        
        create_metadata_accounts_v3(
            metadata_ctx,
            metadata_data,
            true, // is_mutable
            true, // update_authority_is_signer
            None, // collection_details
        )?;

        // Freeze Mint Authority (revoke)
        let freeze_accounts = token::SetAuthority {
            account_or_mint: ctx.accounts.badge_mint.to_account_info(),
            current_authority: ctx.accounts.authority.to_account_info(),
        };
        let freeze_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), freeze_accounts);
        token::set_authority(
            freeze_ctx,
            token::spl_token::instruction::AuthorityType::MintTokens,
            None,
        )?;

        // Save mint address to identity
        identity.badge_mint = Some(ctx.accounts.badge_mint.key());

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

#[derive(Accounts)]
pub struct MintIdentityBadge<'info> {
    #[account(
        mut,
        seeds = [b"identity", authority.key().as_ref()],
        bump,
        has_one = authority @ IdentityError::Unauthorized,
    )]
    pub identity_account: Account<'info, IdentityAccount>,

    #[account(
        seeds = [b"score", authority.key().as_ref()],
        bump,
        constraint = identity_score_account.authority == authority.key() @ IdentityError::ScoreNotInitialized
    )]
    pub identity_score_account: Account<'info, IdentityScoreAccount>,

    #[account(
        init,
        payer = authority,
        mint::decimals = 0,
        mint::authority = authority,
        mint::freeze_authority = authority,
    )]
    pub badge_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        associated_token::mint = badge_mint,
        associated_token::authority = authority,
    )]
    pub token_account: Account<'info, TokenAccount>,

    /// CHECK: Metaplex Metadata PDA derived in CLI or Frontend
    #[account(
        mut,
        seeds = [
            b"metadata", 
            token_metadata_program.key().as_ref(), 
            badge_mint.key().as_ref()
        ],
        seeds::program = token_metadata_program.key(),
        bump,
    )]
    pub metadata_account: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    /// CHECK: Metaplex Token Metadata Program
    #[account(address = mpl_token_metadata::ID)]
    pub token_metadata_program: UncheckedAccount<'info>,
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

#[account]
pub struct IdentityAccount {
    pub authority: Pubkey,
    pub handle: String,
    pub created_at: i64,
    pub badge_mint: Option<Pubkey>,
}

impl IdentityAccount {
    pub const SPACE: usize = 8 + 32 + (4 + 32) + 8 + (1 + 32);
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

    #[msg("Identity badge has already been minted.")]
    BadgeAlreadyMinted,

    #[msg("Identity score account not initialized.")]
    ScoreNotInitialized,
}
