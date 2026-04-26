# DBTalk — Setup Guide

## Prerequisites
- Node.js 20+
- A Neon PostgreSQL database (or any Postgres)
- Clerk account (free)
- Groq API key (free)

## 1. Install dependencies

```bash
npm install
```

## 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

Required values:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [clerk.com](https://clerk.com) → Your App → API Keys |
| `CLERK_SECRET_KEY` | Same as above |
| `DATABASE_URL` | [neon.tech](https://neon.tech) → Connection string |
| `ENCRYPTION_KEY` | Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) |
| `MCP_SERVER_URL` | URL of your mcp-server backend (default: `http://localhost:3001`) |

## 3. Set up database

```bash
npm run db:push
```

## 4. Configure Clerk

In your Clerk dashboard:
- **Sign-in URL:** `/sign-in`  
- **Sign-up URL:** `/sign-up`  
- **After sign-in:** `/dashboard`  
- **After sign-up:** `/onboarding`

## 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 6. Connect your MCP backend

Make sure your `mcp-server` is running on `http://localhost:3001` (or update `MCP_SERVER_URL`).

The website connects to the backend via:
- `POST /api/connections` → saves DB credentials (encrypted)
- `POST /api/keys` → generates API keys
- `GET /api/config/download` → downloads Claude Desktop config
- `POST /api/chat` → Groq-powered AI chat

## User flow

1. User signs up → redirected to `/onboarding`
2. `syncUser()` runs in layout → creates DB row
3. Onboarding wizard: connect DB → generate key → choose integration
4. `POST /api/onboarding/complete` → sets `onboardingCompletedAt`
5. User lands in dashboard — fully functional

## Build for production

```bash
npm run build
npm start
```
