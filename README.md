# DBTalk

DBTalk is a full-stack AI database assistant for connecting databases, asking questions in natural language, generating scoped API keys, and exposing database access through a secure Model Context Protocol (MCP) server.

The repository contains two deployable apps:

- `frontend`: Next.js dashboard, landing page, Clerk auth, onboarding, API key management, analytics, and Groq-powered chat.
- `mcp-server`: Express/TypeScript MCP backend for secure database tool access over SSE and REST transports.

## Features

- Natural language database chat powered by Groq.
- Supports PostgreSQL, MySQL, and MongoDB connections.
- Secure credential encryption with AES-256-GCM.
- Clerk authentication and onboarding flow.
- Scoped API keys with read/write permissions and rate limits.
- Audit logging for database tool calls.
- Claude Desktop config download for MCP integration.
- Dashboard pages for connections, API keys, chat, analytics, and settings.

## Tech Stack

- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS, Clerk, Drizzle ORM, Neon/PostgreSQL, Groq.
- MCP server: Node.js, Express, TypeScript, Drizzle ORM, PostgreSQL, Redis-compatible rate limiting, MCP SDK.
- Databases supported through MCP: PostgreSQL, MySQL, MongoDB.

## Project Structure

```text
.
├── frontend/      # Next.js app and dashboard
└── mcp-server/    # MCP API server
```

## Prerequisites

- Node.js 20+
- npm
- PostgreSQL database for platform data
- Clerk application
- Groq API key
- Redis instance, optional but recommended for production rate limiting

## Environment Variables

### Frontend

Create `frontend/.env` or `frontend/.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

DATABASE_URL=postgresql://user:password@host/db
ENCRYPTION_KEY=your-64-char-hex-key
GROQ_API_KEY=gsk_...

MCP_SERVER_URL=http://localhost:3001
NEXT_PUBLIC_MCP_SERVER_URL=http://localhost:3001
API_KEY_PREFIX=mcp_live_
```

### MCP Server

Create `mcp-server/.env`:

```env
DATABASE_URL=postgresql://user:password@host/db
ENCRYPTION_KEY=your-64-char-hex-key
REDIS_URL=redis://localhost:6379
PORT=3001
NODE_ENV=development
API_KEY_PREFIX=mcp_live_
CORS_ORIGIN=http://localhost:3000
```

Generate an encryption key with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use the same `ENCRYPTION_KEY` anywhere encrypted database credentials must be read or written.

## Local Setup

Install dependencies for both apps:

```bash
cd frontend
npm install

cd ../mcp-server
npm install
```

Set up the frontend database schema:

```bash
cd frontend
npm run db:push
```

Set up the MCP server database schema:

```bash
cd mcp-server
npm run db:migrate
```

Run both apps in development:

```bash
cd mcp-server
npm run dev
```

In a second terminal:

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000`.

## Clerk Setup

In the Clerk dashboard, configure:

- Sign-in URL: `/sign-in`
- Sign-up URL: `/sign-up`
- After sign-in URL: `/dashboard`
- After sign-up URL: `/onboarding`

## Main URLs

- Landing page: `http://localhost:3000`
- Dashboard: `http://localhost:3000/dashboard`
- Sign in: `http://localhost:3000/sign-in`
- Sign up: `http://localhost:3000/sign-up`
- MCP SSE endpoint: `http://localhost:3001/mcp/sse`
- MCP REST message endpoint: `http://localhost:3001/mcp/message`
- MCP server API routes: `http://localhost:3001/api`

## Production Build

Build the frontend:

```bash
cd frontend
npm run build
npm start
```

Build the MCP server:

```bash
cd mcp-server
npm run build
npm start
```

## Deployment Notes

- Deploy `frontend` and `mcp-server` as separate services.
- Set `MCP_SERVER_URL` and `NEXT_PUBLIC_MCP_SERVER_URL` in the frontend to the public MCP server URL.
- Set `CORS_ORIGIN` in `mcp-server` to the public frontend URL.
- Use a managed PostgreSQL database for `DATABASE_URL`.
- Use a managed Redis service for production rate limiting when available.
- Keep `ENCRYPTION_KEY`, `CLERK_SECRET_KEY`, and `GROQ_API_KEY` private.
- Run database migrations before serving production traffic.

## Useful Commands

Frontend:

```bash
npm run dev
npm run build
npm start
npm run db:push
npm run db:studio
```

MCP server:

```bash
npm run dev
npm run build
npm start
npm run db:generate
npm run db:migrate
npm run db:studio
npm run db:seed
```

## Security

- Database credentials are encrypted before storage.
- API keys are hashed and shown only once.
- API keys can be scoped to read or write access.
- Write operations require explicit permission and should be handled with care.
- Audit logs record tool calls, success state, duration, and errors.

## License

Copyright 2026 DBTalk. All rights reserved.
