# Premier Timesheets

Time tracking PWA for Premier UK Events Ltd — replaces Deputy.

## Setup

### 1. Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/migrations/001_schema.sql`
3. Then run `supabase/migrations/002_seed.sql`
4. Copy your **Project URL**, **anon key**, and **service role key** from Project Settings → API

### 2. Resend (email)

1. Sign up at [resend.com](https://resend.com) (free tier: 100 emails/day)
2. Create an API key
3. Add and verify `premier-ltd.com` as a sending domain (or use the Resend test domain for now)

### 3. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=re_your-key
JWT_SECRET=generate-a-long-random-secret  # e.g. openssl rand -base64 32
NEXT_PUBLIC_APP_URL=https://timesheets.premier-ltd.com
```

### 4. Run locally

```bash
npm install
npm run dev
```

### 5. Deploy to Vercel

1. Push to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Set custom domain: `timesheets.premier-ltd.com`

## Default PINs (development)

| Name | PIN |
|------|-----|
| Aivars Mazjanis | 1001 |
| Alex Horder | 1002 |
| Ben Colverson | 1003 |
| Callum Pell | 1004 |
| Calum Fitzpatrick | 1005 |
| Charlie Stevenson-Deacon | 1006 |
| Charlotte Gambrill (admin) | 1007 |
| Chris Finch | 1008 |
| Dade Freeman | 1009 |
| Danny Wells | 1010 |
| Kamil Miler | 1011 |
| Kieran Shutler | 1012 |
| Rachel Howden | 1013 |
| Tom Williams | 1014 |

## PWA Install

On mobile, visit the site and tap **Add to Home Screen** from the browser menu. The app will install like a native app with offline support.
