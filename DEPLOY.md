# Deployment Protocol: MargenKalkulator

## 1. Prerequisites
- [ ] **Supabase CLI** installed (`brew install supabase/tap/supabase`)
- [ ] **Vercel CLI** installed (`npm i -g vercel`)
- [ ] **Docker** running (for local DB simulation)

## 2. Supabase (Backend)
### Link to Live Project
1. Create a new project on [Supabase.com](https://supabase.com).
2. Get your `project-ref` (e.g., `abcdefghijklm`).
3. Login and Link:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   ```

### Deploy Database Schema (The Iron Vault)
Push the local migrations to the remote database.
```bash
npx supabase db push
```
*Note: This will apply `20240101_init.sql` and `20240102_add_pricing.sql`.*

### Deploy Edge Functions (The Black Box)
Deploy the calculation engine.
```bash
npx supabase functions deploy calculate-margin --no-verify-jwt
```
*Note: We disable JWT verification at the gateway level because we handle CORS and internal logic manually, or you can enable it and enforce it in the client.*
**CRITICAL**: You must set the secrets in the live project:
```bash
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 3. Vercel (Frontend)
### Connect & Deploy
1. Run Vercel in the `src` directory:
   ```bash
   cd src
   vercel login
   vercel
   ```
2. Follow the prompts to link the project.

### Environment Variables
In Vercel Project Settings > Environment Variables, add:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key.

## 4. Verification (The Golden Seal)
1. Open the Production URL.
2. Verify the "System Online" indicator is pulsing.
3. Perform a calculation to verify the Edge Function handshake.
