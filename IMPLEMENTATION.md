# AnonSignals Implementation Guide

## Overview

AnonSignals is a privacy-first anonymous signaling application that enables verified communities to share feedback, create proposals, and vote anonymously using zero-knowledge proofs. The app integrates three key technologies:

1. **ZK Email** - For email-based group verification
2. **Semaphore** - For anonymous identity management and proof generation
3. **ZK Verify** - For proof verification on the blockchain

## Architecture

### Core Components

1. **Frontend (Next.js)**
   - Group creation and management
   - Email verification flow
   - Anonymous posting and voting
   - Real-time proof generation

2. **Database (Supabase)**
   - Groups and memberships
   - Posts and votes
   - Semaphore identities (encrypted)
   - Proof hashes for verification

3. **Zero-Knowledge Infrastructure**
   - ZK Email SDK for email verification
   - Semaphore protocol for anonymous proofs
   - ZK Verify relayer for on-chain verification

## Key Features

### 1. Email-Based Group Creation
- Groups are created with specific email blueprints (GitHub format)
- Example: `zkemail/yc-demo-day@v1.0.0`
- Supports various verification patterns (company emails, event participation, etc.)

### 2. Zero-Knowledge Email Verification
- Users upload `.eml` files to prove email eligibility
- ZK Email SDK generates proofs without revealing email content
- Proofs are verified using specified blueprints

### 3. Semaphore Identity Management
- Each user gets a unique Semaphore identity per group
- Identities are stored encrypted in both database and local storage
- Enables anonymous actions with proof of group membership

### 4. Anonymous Posting and Voting
- All posts and votes generate Semaphore proofs
- Proofs are verified via ZK Verify before database storage
- Complete anonymity while maintaining integrity

## Implementation Details

### Group Creation Flow
1. User creates group with name, description, and email blueprint
2. Semaphore group is initialized
3. Group data stored in Supabase with unique semaphore_group_id

### Group Joining Flow
1. User uploads `.eml` file for verification
2. ZK Email SDK generates proof using the group's blueprint
3. Verification key (vkey) registered with ZK Verify relayer (cached for reuse)
4. ZK Email proof automatically submitted to ZK Verify relayer
5. System polls ZK Verify for verification completion (Finalized/Aggregated status)
6. Upon successful verification, Semaphore identity generated and stored (encrypted)
7. User added to group membership with ZK Verify job ID as proof reference

### Anonymous Posting Flow
1. User creates post/proposal in group interface
2. Semaphore proof generated with post content as message
3. Proof submitted to ZK Verify for verification
4. Upon verification, post stored in database with proof hash

### Anonymous Voting Flow
1. User votes on proposal in group
2. Semaphore proof generated with vote choice and post ID
3. Proof verified via ZK Verify
4. Vote recorded in database with nullifier to prevent double voting

## Database Schema

### Groups Table
- `id`: UUID primary key
- `name`: Group name
- `description`: Group description
- `email_blueprint`: GitHub blueprint format
- `semaphore_group_id`: Unique Semaphore group identifier
- `creator_anonymous_id`: Creator's anonymous ID
- `member_count`: Current member count

### Group Memberships Table
- `id`: UUID primary key
- `group_id`: Reference to groups table
- `user_anonymous_id`: User's anonymous identifier
- `semaphore_identity_commitment`: Semaphore identity commitment
- `zk_email_proof_hash`: Hash of ZK Email verification proof
- `zk_verify_proof_hash`: Hash of ZK Verify proof

### Posts Table
- `id`: UUID primary key
- `group_id`: Reference to groups table
- `author_anonymous_id`: Author's anonymous ID
- `type`: 'post' or 'proposal'
- `title`: Post title
- `content`: Post content
- `semaphore_proof`: Serialized Semaphore proof
- `zk_verify_proof_hash`: Verification proof hash

### Votes Table
- `id`: UUID primary key
- `post_id`: Reference to posts table
- `voter_anonymous_id`: Voter's anonymous ID
- `vote_choice`: 'yes' or 'no'
- `semaphore_proof`: Serialized Semaphore proof
- `zk_verify_proof_hash`: Verification proof hash

## Security Considerations

### Privacy Protection
- User identities never exposed to other group members
- Email content remains private through ZK proofs
- Semaphore nullifiers prevent proof replay attacks
- All proofs verified on-chain for integrity

### Data Storage
- Semaphore identity secrets encrypted with user's anonymous ID
- Proof hashes stored for verification but not original proofs
- Anonymous IDs are randomly generated and stored locally

### Verification Chain
1. ZK Email proves email eligibility without revealing content
2. ZK Verify ensures all proofs are valid before database storage
3. Semaphore prevents double voting and maintains anonymity
4. Database constraints ensure data integrity

## Environment Setup

Required environment variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# ZK Verify Configuration (HorizenLabs Relayer)
ZK_VERIFY_RELAYER_URL=https://relayer-api.horizenlabs.io/api/v1
ZK_VERIFY_API_KEY=your_zk_verify_api_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## API Integration

### ZK Email Integration
- Uses `@zk-email/sdk` with `initZkEmailSdk()` for proof generation
- Fetches blueprints directly from the SDK registry
- Generates Groth16 proofs from `.eml` files using remote proving
- Automatic vkey registration and caching with ZK Verify

### ZK Verify Integration
- HorizenLabs relayer integration for on-chain proof verification
- Automatic vkey registration with caching to avoid re-registration
- Job-based verification with polling for completion status
- Supports both Finalized and Aggregated verification statuses

### Semaphore Integration
- Uses `@semaphore-protocol/` packages
- Identity management with encryption
- Proof generation for anonymous actions

## Future Enhancements

1. **Mobile App Support**
   - React Native implementation
   - Mobile-optimized proof generation

2. **Advanced Group Types**
   - Multi-blueprint verification
   - Hierarchical group structures
   - Time-based memberships

3. **Enhanced Privacy**
   - Mixer-style proof batching
   - Advanced nullifier schemes
   - Cross-group anonymity

4. **Governance Features**
   - Multi-choice voting
   - Weighted voting systems
   - Proposal lifecycle management

## Testing

The implementation includes comprehensive error handling and user feedback for all zero-knowledge operations. Key testing areas:

1. Email verification with various blueprint formats
2. Semaphore proof generation and verification
3. ZK Verify relayer integration
4. Database consistency and integrity
5. Anonymous identity management

## Deployment

1. Set up Supabase project and run schema migration
2. Configure ZK Email and ZK Verify API keys
3. Deploy Next.js application to Vercel or similar platform
4. Ensure all environment variables are properly configured

This implementation provides a complete foundation for anonymous signaling with strong privacy guarantees and verifiable integrity through zero-knowledge proofs.
