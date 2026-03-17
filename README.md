# ALP Store Audit

Store Renovation Tracker — a full-stack web application built with Next.js 14, Supabase, and Tailwind CSS.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase project credentials:

```bash
cp .env.example .env.local
```

### 3. Run database migrations

Open your Supabase project SQL Editor and paste the contents of:

```
supabase/migrations/001_schema.sql
```

Execute the SQL to create all tables, triggers, RLS policies, and helper functions.

### 4. Seed the database

```bash
npx ts-node --project tsconfig.json supabase/seed.ts
```

This creates:
- 4 regions
- 6 employees with auth users
- 5 stores
- 23 checklist items
- 4 storage buckets

### 5. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Test Credentials

| Employee ID  | Email                       | Password    | Role     |
|--------------|-----------------------------|-------------|----------|
| EMP-NSO-001  | priya.kapoor@company.com    | Nso@1234    | NSO Head |
| EMP-NSO-002  | arvind.mehta@company.com    | Nso@1234    | NSO Head |
| EMP-SM-001   | amit.sharma@company.com     | Sm@1234     | SM       |
| EMP-SM-002   | rahul.sinha@company.com     | Sm@1234     | SM       |
| EMP-SM-003   | sneha.patil@company.com     | Sm@1234     | SM       |
| EMP-ADM-001  | admin@company.com           | Admin@1234  | Admin    |

## Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add environment variables in Vercel project settings
4. Deploy

The app is configured to deploy to the Mumbai (bom1) region via `vercel.json`.

## Architecture

- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions)
- **Design System**: TailAdmin-inspired with Outfit font
- **Charts**: Chart.js + react-chartjs-2
- **Offline**: IndexedDB queue for SM mobile usage
- **Reports**: PDF generation via window.print()
