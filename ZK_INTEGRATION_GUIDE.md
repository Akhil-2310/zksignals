# ZK Integration Guide - Updated Implementation

## Overview

The AnonSignals app now correctly integrates ZK Email and ZK Verify using the proper SDK and relayer approach, following the pattern demonstrated in your example code.

## Key Changes Made

### 1. ZK Email Integration (`lib/zk-email.ts`)

**✅ Correct Implementation:**
- Uses `initZkEmailSdk()` from `@zk-email/sdk`
- Fetches blueprints directly from the SDK registry
- Generates Groth16 proofs using remote proving
- Automatically registers verification keys with ZK Verify relayer
- Caches vkHash to avoid re-registration

**Key Functions:**
```typescript
// Generate proof and submit to ZK Verify
verifyEmailWithBlueprint(emlFile: File, blueprintString: string)

// Poll for verification completion
waitForEmailVerification(jobId: string)
```

### 2. ZK Verify Integration (`lib/zk-verify.ts`)

**✅ Updated Configuration:**
- Uses HorizenLabs relayer: `https://relayer-api.horizenlabs.io/api/v1`
- Proper vkey registration with caching
- Job-based verification polling
- Supports Finalized/Aggregated statuses

### 3. Environment Configuration

**Required Variables:**
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

**Note:** ZK Email API key is no longer required as we use the SDK directly.

## Updated Flow

### Email Verification Process

1. **Upload EML File**: User uploads `.eml` file in the UI
2. **Initialize SDK**: `initZkEmailSdk()` creates SDK instance
3. **Get Blueprint**: SDK fetches blueprint using the slug format
4. **Register VKey**: Verification key registered with ZK Verify (cached)
5. **Generate Proof**: ZK Email proof generated using remote proving
6. **Submit to ZK Verify**: Proof automatically submitted to relayer
7. **Poll Status**: System polls for verification completion
8. **Complete**: On success (Finalized/Aggregated), user joins group

### Code Example (from groups page)

```typescript
// Step 1: Generate proof and submit to ZK Verify
const emailVerification = await verifyEmailWithBlueprint(uploadFile, group.email_blueprint)

if (!emailVerification.isValid) {
  throw new Error(emailVerification.error)
}

// Step 2: Wait for verification completion
const verificationResult = await waitForEmailVerification(emailVerification.jobId)

if (!verificationResult.success) {
  throw new Error(verificationResult.error)
}

// Step 3: Generate Semaphore identity and join group
const semaphoreIdentity = getOrCreateSemaphoreIdentity()
await joinGroupDB(groupId, userId, semaphoreIdentity.commitment, emailVerification.jobId, `zkverify_${emailVerification.jobId}`)
```

## Testing

A test script has been provided (`test-zkemail.js`) to verify the integration:

```bash
node test-zkemail.js path/to/your.eml YourBlueprint/Slug@version
```

## Key Technical Details

### ZK Email SDK Usage
- Uses latest `@zk-email/sdk` with `initZkEmailSdk()`
- Handles both `publicOutputs` and `publicData` naming variations
- Remote proving by default (no local setup required)

### ZK Verify Relayer
- Proper vkey registration with Groth16 proofs
- Uses `vkRegistered: true` with vkHash (not full vkey)
- Job-based verification with polling
- Optimistic verification check before polling

### Error Handling
- Comprehensive error handling for each step
- User-friendly error messages in UI
- Proper loading states during verification

### Performance Optimizations
- VKey registration caching to avoid re-registration
- Efficient polling with configurable intervals
- Background job processing

## Migration Notes

If you're updating from the previous implementation:

1. **Environment**: Remove `ZK_EMAIL_API_KEY` from your environment
2. **Database**: Existing schema remains compatible
3. **UI**: Updated verification flow with better status messages
4. **Testing**: Use the provided test script to verify integration

## Production Deployment

1. Set up Supabase project with the provided schema
2. Get ZK Verify API key from HorizenLabs
3. Configure environment variables
4. Deploy to your preferred platform (Vercel, etc.)

The implementation now correctly follows the ZK Email + ZK Verify integration pattern and should work seamlessly with real email verification workflows.
