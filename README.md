# Influence AI Creator Intelligence

Influence is a full-stack creator campaign workspace. It combines account-based authentication, explainable creator matching, campaign assignment, first-party live chat, saved workspace state, milestones, and recalculated analytics in one Vercel-ready Next.js app.

## What is functional

- Google OAuth and a server-validated demo login
- Account-derived names and initials throughout the interface
- Full profile page with editable workspace preferences
- Creator search, filters, favourites, risk signals, and match explanations
- Campaign creation through an authenticated server route
- Assign and remove creators from both creator profiles and campaign workspaces
- Persistent milestones, campaigns, favourites, chat threads, and preferences
- In-app real-time chat backed by Supabase; two signed-in browsers see new messages without refreshing
- Responsive desktop/mobile navigation and `Ctrl/⌘ + K` command search

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev:next
```

Open `http://localhost:3000`.

## Demo login

- Email: `demo@influence.ai`
- Password: `demo123`
- Demo identity: **Manami Bera**

Google users see their own Google profile name. The greeting, profile page, sidebar identity, and avatar initials all derive from the authenticated session.

## 1. Configure Google sign-in

Create an OAuth 2.0 Client ID in Google Cloud Console with application type **Web application**.

- Authorized JavaScript origin: `https://influence-ai-creator-intelligence.vercel.app`
- Authorized redirect URI: `https://influence-ai-creator-intelligence.vercel.app/api/auth/callback/google`

Add these variables in Vercel → Project Settings → Environment Variables:

```env
AUTH_SECRET=generate-a-long-random-value
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
NEXT_PUBLIC_SITE_URL=https://influence-ai-creator-intelligence.vercel.app
```

For local OAuth, also add `http://localhost:3000/api/auth/callback/google` to Google’s authorized redirect URIs.

## 2. Configure cross-browser real-time chat

1. Create a Supabase project.
2. Open Supabase → SQL Editor and run [`supabase/chat.sql`](./supabase/chat.sql).
3. In Supabase → Project Settings → API, copy the project URL, publishable key, and secret key.
4. Add these variables to Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
SUPABASE_SECRET_KEY=sb_secret_your_server_key
```

`SUPABASE_SECRET_KEY` is server-only. Never prefix it with `NEXT_PUBLIC_` or commit it. Legacy projects can use `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` instead.

To test live chat, sign in as two accounts in separate browsers, open **Inbox**, select the same creator conversation, and send a message. Supabase persists the message and broadcasts the insert to the other open browser without a refresh.

Without Supabase variables the UI intentionally falls back to local demo messages; cross-browser delivery requires the database configuration above.

## 3. Deploy to Vercel

1. Push the project to GitHub.
2. Import the repository in Vercel.
3. Keep Framework Preset as **Next.js** and Root Directory as `./`.
4. Add all Google and Supabase environment variables for Production, Preview, and Development.
5. Deploy or redeploy after adding variables.

The included `vercel.json` runs `npm run build:vercel`. No custom output directory is required.

## Verification commands

```bash
npm run lint
npm run build:vercel
```

See [PITCH_GUIDE.md](./PITCH_GUIDE.md) for the judge walkthrough.
