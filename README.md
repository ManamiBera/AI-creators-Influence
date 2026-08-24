# Creators Influence 

Creators Influence is a full-stack campaign collaboration workspace built with Next.js, Supabase, and Vercel. Registered users can discover one another, communicate inside the app, create shared campaigns, assign or remove team members, and track campaign progress.

**Live app:** https://creators-influence.vercel.app

## Features

- Email/password account creation and sign-in with Supabase Auth
- Account-derived names, initials, greetings, and profile information
- Directory containing real registered accounts—no preset users
- Private in-app messaging stored in Supabase
- Cross-browser chat updates approximately every 1.5 seconds
- Campaign creation backed by Supabase
- Shared campaigns visible across signed-in devices
- Assign and remove registered users from campaigns
- Campaign milestone and progress updates
- Responsive desktop and mobile interface
- Command search for users, pages, and campaigns
- Pitch-ready analytics page using clearly separated demonstration analytics

## Technology

- Next.js 16 and React 19
- TypeScript
- NextAuth credentials sessions
- Supabase Auth and PostgreSQL
- Vercel hosting

## Run Locally

Requirements:

- Node.js 22.13 or newer
- A Supabase project

Install the project:

```bash
npm install
```

Create `.env.local` in the project root:

```env
AUTH_SECRET=replace-with-a-long-random-secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-server-secret-key
```

Run the database setup from `supabase/chat.sql` in the Supabase SQL Editor, then start the development server:

```bash
npm run dev
```

Open http://localhost:3000.

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `AUTH_SECRET` | Encrypts and signs authentication sessions |
| `NEXT_PUBLIC_SITE_URL` | Public application URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase key used for authentication |
| `SUPABASE_SECRET_KEY` | Server-only key used by authenticated API routes |

Never expose `SUPABASE_SECRET_KEY` in client code or prefix it with `NEXT_PUBLIC_`.

## Deploy to Vercel

1. Push the repository to GitHub.
2. Import the GitHub repository into Vercel.
3. Select the **Next.js** framework preset.
4. Add all five environment variables to the Production environment.
5. Set:

```env
NEXT_PUBLIC_SITE_URL=https://ai-creators-influence.vercel.app
```

6. Deploy the project.

Every push to the `main` branch triggers a new Vercel deployment.

## Verify the Build

```bash
npm run lint
npm run build
```

A successful build includes these dynamic routes:

```text
/api/auth/[...nextauth]
/api/auth/register
/api/campaigns
/api/chat
/api/users
```

## Test the Dynamic Features

1. Create two accounts with different email addresses.
2. Open each account in a separate browser.
3. Confirm that each account can find the other in Discover and Inbox.
4. Send messages and confirm they appear in the other browser.
5. Create a campaign.
6. Assign the second user to the campaign.
7. Confirm the campaign and assignment appear from the second account.
8. Advance the campaign and confirm the progress is shared.

## Data Behaviour

- Registered accounts come from Supabase Auth.
- Messages and campaigns are stored in Supabase PostgreSQL.
- Discover, Inbox, Campaigns, and Overview use live workspace data.
- Profile preferences are saved in the current browser.
- Analytics intentionally contains demonstration data for the product pitch.

## Security Notes

- Server API routes verify the signed-in session before reading or changing data.
- Supabase secret credentials remain server-side.
- Database tables have Row Level Security enabled and are accessed through authenticated server routes.
- The project does not include hardcoded login credentials.

## Production URL

https://creators-influence.vercel.app
