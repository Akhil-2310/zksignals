# Environment Variables Setup

Copy the following variables to your `.env.local` file and fill in your actual values:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# ZK Verify Relayer Configuration
ZK_VERIFY_RELAYER_URL=https://relayer-api.horizenlabs.io/api/v1
ZK_VERIFY_API_KEY=your_zk_verify_api_key

# Semaphore Configuration
SEMAPHORE_VK_HASH=your_semaphore_vkey_hash

# Application Configuration (Optional)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## How to Get These Values:

### Supabase:
1. Go to your Supabase project dashboard
2. Go to Settings > API
3. Copy the "Project URL" and "anon public" key
4. Make sure to set up the database schema from `database/schema.sql`

### ZK Verify:
1. Sign up at HorizenLabs ZK Verify relayer
2. Get your API key from the dashboard
3. **Important**: This API key is required for both ZK Email and Semaphore proof verification

### Semaphore:
1. Use the vkey hash you provided for the Semaphore circuit
2. This should be the hash of your registered verification key

## Common Issues:

### "401 Unauthorized" Error:
- Make sure `ZK_VERIFY_API_KEY` is set correctly in your `.env.local`
- Verify your API key is valid and active

### "406 Not Acceptable" Error:
- Check your Supabase RLS policies are set up correctly
- Ensure the database schema is properly imported

## Testing:
Once you have all environment variables set up, you can test the application by running:
```bash
npm run dev
```
