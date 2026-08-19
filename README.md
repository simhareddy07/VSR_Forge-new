# VSR Forge

VSR Forge is a project workspace for issue tracking, team collaboration, and delivery monitoring.

## Run locally

```powershell
npm install
npm run dev:full
```

Open `http://localhost:5173`. The API runs at `http://localhost:4000`. For frontend-only work, use `npm run dev`; the UI falls back to seed issues when the API is unavailable.

## Persistence

The API uses an in-memory store by default. To persist issues in MongoDB, copy `.env.example` to `.env` and set `MONGODB_URI`:

```powershell
Copy-Item .env.example .env
```

The URI can point to local MongoDB or MongoDB Atlas. `CLIENT_ORIGIN` accepts comma-separated frontend origins.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Check API and database mode |
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
