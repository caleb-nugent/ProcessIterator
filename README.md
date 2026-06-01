# ProcessIterator

SOP (Standard Operating Procedure) builder with live step timing, AI outline generation, and team sharing.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` — PostgreSQL connection string (e.g. `postgresql://user:pass@localhost:5432/process_iterator`)
- `NEXTAUTH_SECRET` — Random secret: `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` for local dev
- `ANTHROPIC_API_KEY` — Add when ready to enable AI outline generation

### 3. Set up the database
```bash
npm run db:migrate    # Apply migrations (creates tables)
# OR for quick prototyping without migrations:
npm run db:push       # Push schema directly
```

### 4. Run
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll land on the login page. Create an account to get started.

---

## Features

- **Folder organization** — Group processes into color-coded folders
- **Manual process creation** — Build SOPs step by step
- **AI outline generation** — Describe a process, get a draft outline (requires `ANTHROPIC_API_KEY`)
- **Step timing** — Live start/stop timer per step, or log duration manually (`45m`, `1h 30m`, `90s`)
- **Run history** — Every step tracks a timestamped history of timed runs with optional notes
- **Team sharing** — Share processes with colleagues (view or edit permission)
- **Stats** — Average duration per step, total runs, estimated total process time

## Tech Stack

- **Next.js 14** (App Router)
- **Prisma** + **PostgreSQL**
- **NextAuth.js** (credentials auth)
- **Tailwind CSS**
- **Anthropic SDK** (AI outline generation)
