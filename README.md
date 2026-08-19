# VSR Forge

VSR Forge is a project workspace for issue tracking, team collaboration, and delivery monitoring.

## Architecture

```text
frontend/     React + TypeScript + Vite application
backend/src/  Express + MongoDB API
scripts/      API smoke tests
```

## Run locally

```powershell
npm install
npm run dev:full
```

Open `http://localhost:5173`. The API runs at `http://localhost:4000`. For frontend-only work, use `npm run dev`; the UI falls back to seed issues when the API is unavailable.

## Persistence

The API uses an in-memory store when MongoDB is unavailable. To persist users and issues in MongoDB, set `MONGODB_URI` in `.env`:

```powershell
Copy-Item .env.example .env
```

The URI can point to local MongoDB or MongoDB Atlas. `CLIENT_ORIGIN` accepts comma-separated frontend origins.

Authentication stores passwords as bcrypt hashes. Plain-text passwords are never stored or returned. In development, inspect stored account metadata with:

```powershell
Invoke-RestMethod http://localhost:4000/api/auth/debug-users
```

This endpoint reports account emails and whether a bcrypt hash exists. It is disabled when `NODE_ENV=production`.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Check API and database mode |
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Sign in and receive a JWT |
| GET | `/api/auth/me` | Read the signed-in user |
| GET | `/api/auth/debug-users` | Development-only storage check |
| GET | `/api/issues` | List issues |
| POST | `/api/issues` | Create an issue |
| PATCH | `/api/issues/:id` | Update issue status |
| DELETE | `/api/issues/:id` | Archive an issue |

Run the API smoke test while the server is running:

```powershell
npm run test:api
```

## Validation

```powershell
npm run lint
npm run build
```
