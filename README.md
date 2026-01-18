# MargenKalkulator (Enterprise Financial Platform)

## 1. The Mission
MargenKalkulator is a secure, event-driven financial platform designed to calculate margins for enterprise contracts without exposing sensitive pricing data to the client. It replaces Excel-based workflows with a secure, centralized "Iron Vault".

## 2. The Stack
- **Frontend**: Next.js 14, Tailwind CSS, Shadcn UI (Vodafone Enterprise Aesthetic).
- **Backend**: Supabase (PostgreSQL).
- **Logic**: Deno Edge Functions ("The Black Box").
- **Contracts**: Zod (Type-Safety).

## 3. The Architecture (Split-Table Security)
To protect commercial secrets, we use a specific database pattern:
- **`tariffs_public`**: Contains open data (Name, Provider). Accessible by Authenticated Users.
- **`tariffs_commercial`**: Contains `cost_price` and `margin_rules`. **NO API ACCESS**. Accessible ONLY by Edge Functions via `service_role`.

## 4. Environment Variables
Ensure these keys are present in your `.env` (local) or Vercel Environment (Production):
- `NEXT_PUBLIC_SUPABASE_URL`: API URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public Client Key.
- `SUPABASE_SERVICE_ROLE_KEY`: **SECRET** Admin Key (Edge Functions Only).

## 5. Development
1. `npm install` (in `/src`)
2. `npm run dev`
3. Local URL: `http://localhost:3000`
