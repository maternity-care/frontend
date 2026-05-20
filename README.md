# Maternity Care Frontend

Next.js frontend for the Maternity Care System.

## Structure

This is one Next.js project with separated user and management code folders:

- `src/app`: app routes
- `src/app/login`, `src/app/profile`, `src/app/uploads`: user-facing routes
- `src/app/management/*`: management routes under `/management`
- `src/fe`: user frontend components, features, and style conventions
- `src/management`: management components, features, and style conventions
- `src/lib`, `src/hooks`, `src/providers`: shared utilities, hooks, and providers
- `src/features`: shared auth/profile/settings features

## Install

```bash
npm install
```

If PowerShell blocks `npm.ps1`, use:

```bash
npm.cmd install
```

## Environment

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Default values:

```text
NEXT_PUBLIC_API_URL=http://localhost:84
NEXT_ENABLE_SOURCE_MAP=false
```

## Run Local

```bash
npm run dev
```

PowerShell-safe command:

```bash
npm.cmd run dev
```

Frontend URL:

```text
http://localhost:3000
```

## Routes

User routes:

- `/`
- `/login`
- `/profile`
- `/uploads`

Management routes:

- `/management/login`
- `/management/dashboard`
- `/management/users`
- `/management/roles`
- `/management/permissions`
- `/management/jobs`
- `/management/profile`
- `/management/uploads`

## Build

```bash
npm run build
```

PowerShell-safe command:

```bash
npm.cmd run build
```

## Docker

Build:

```bash
docker compose build
```

Run:

```bash
docker compose up -d
```

Docker exposes frontend at:

```text
http://localhost:3000
```

## Source Maps

Production browser source maps are disabled by default:

```text
NEXT_ENABLE_SOURCE_MAP=false
```

Set this to `true` when production browser source maps are needed:

```text
NEXT_ENABLE_SOURCE_MAP=true
```

## Sample Admin Account

```text
admin@example.com / password
```
