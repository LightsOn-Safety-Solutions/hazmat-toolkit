# Hazmat Toolkit API (Fastify Skeleton)

Minimal backend skeleton aligned to `../openapi/hazmat-api-v1.yaml` and the Postgres/PostGIS migrations.

## Run (after installing deps)

```bash
npm install
npm run dev
```

## Environment

Copy `.env.example` and set:
- `DATABASE_URL`
- `PORT`
- `HOST`
- `JOIN_CODE_TTL_MINUTES` (default short-lived join code TTL)

## Status

Implemented endpoints include:
- `POST /v1/sessions` (creates session + frozen snapshot)
- `POST /v1/sessions/:sessionId/rotate-join-code` (trainer-protected)
- `POST /v1/sessions/:sessionId/start` (trainer-protected)
- `POST /v1/sessions/:sessionId/end` (trainer-protected)
- `POST /v1/sessions/join`
- `GET /v1/sessions/me`
- `GET /v1/sessions/me/snapshot`
- `POST /v1/tracking/batches`
- `GET /v1/sessions/:sessionId/watch/participants` (trainer-protected)
- `GET /v1/sessions/:sessionId/watch/tracking` (trainer-protected)
- `GET /v1/watch/tracking?scenarioName=...` (legacy, trainer-protected)

Some scenario/shape CRUD endpoints are still stubbed.

## Seed Data

```bash
npm run seed
```

This inserts a trainer (`trainer@example.com`) and a published scenario (`Warehouse Leak Alpha`) with example shapes.

## Deploy (Render + Supabase)

This API is designed to run behind a managed Postgres/PostGIS database. A good first cloud setup is:
- **Supabase** for PostgreSQL + PostGIS
- **Render** for the Fastify API

### 1) Supabase database

Make sure your Supabase project has:
- `postgis` extension enabled
- migrations applied (`001`, `002`, `003`)

Connection string format (add SSL):

```text
postgresql://postgres:YOUR_PASSWORD@db.<project-ref>.supabase.co:5432/postgres?sslmode=require
```

Notes:
- For local development on some networks/macOS setups, `sslmode=no-verify` may be needed.
- For cloud deployment, prefer `sslmode=require`.

### 2) Render blueprint

A Render Blueprint file is included at:

```text
/Users/johnholtan/Library/CloudStorage/OneDrive-lightsonss.com/THMG/Final Files/Final Mapper Files/toolbox-site/render.yaml
```

It deploys:
- `backend/postgres/api` as a Node web service
- health check at `/health`
- default join-code TTL of `60` minutes

### 3) Create the Render service

In Render:
1. New -> **Blueprint**
2. Connect your repo
3. Render reads `render.yaml`
4. Set secret env var:
   - `DATABASE_URL` = your Supabase Postgres URL (`?sslmode=require`)
5. Deploy

### 4) Verify

After deploy, test:

```bash
curl https://YOUR-RENDER-SERVICE.onrender.com/health
curl -H "X-Trainer-Ref: trainer@example.com" https://YOUR-RENDER-SERVICE.onrender.com/v1/scenarios
```

### 5) Point iOS apps to cloud API

Update both apps' `Info.plist` values:
- `HazmatAPIBaseURL=https://YOUR-RENDER-SERVICE.onrender.com`

Then rebuild and test Trainer/Trainee join flow.

## End-to-End Curl Walkthrough

Assumes:
- API running on `http://localhost:8080`
- Seed data loaded (`npm run seed`)
- Trainer header is `X-Trainer-Ref: trainer@example.com`

### 1) Create a session from a scenario

First, get a `scenarioId` (seed script prints it). Then:

```bash
curl -sS -X POST http://localhost:8080/v1/sessions \
  -H 'Content-Type: application/json' \
  -d '{
    "scenarioId": "PUT_SCENARIO_ID_HERE",
    "sessionName": "Morning Drill",
    "joinCodeTTLMinutes": 30
  }'
```

Save:
- `session.id`
- `joinCode.joinCode`

### 2) (Optional) Rotate the join code

```bash
curl -sS -X POST http://localhost:8080/v1/sessions/PUT_SESSION_ID_HERE/rotate-join-code \
  -H 'X-Trainer-Ref: trainer@example.com'
```

### 3) Start the session (trainer)

```bash
curl -sS -X POST http://localhost:8080/v1/sessions/PUT_SESSION_ID_HERE/start \
  -H 'X-Trainer-Ref: trainer@example.com'
```

### 4) Join as a trainee (returns session token + frozen snapshot)

```bash
curl -sS -X POST http://localhost:8080/v1/sessions/join \
  -H 'Content-Type: application/json' \
  -d '{
    "joinCode": "PUT_JOIN_CODE_HERE",
    "traineeName": "Trainee 01",
    "deviceType": "air_monitor"
  }'
```

Save:
- `token.accessToken` (bearer token)

### 5) Restore session metadata (trainee)

```bash
curl -sS http://localhost:8080/v1/sessions/me \
  -H 'Authorization: Bearer PUT_TRAINEE_TOKEN_HERE'
```

### 6) Re-fetch frozen snapshot (trainee)

```bash
curl -sS http://localhost:8080/v1/sessions/me/snapshot \
  -H 'Authorization: Bearer PUT_TRAINEE_TOKEN_HERE'
```

### 7) Upload tracking batch (trainee)

```bash
curl -sS -X POST http://localhost:8080/v1/tracking/batches \
  -H 'Authorization: Bearer PUT_TRAINEE_TOKEN_HERE' \
  -H 'Content-Type: application/json' \
  -d '{
    "batchId": "11111111-1111-1111-1111-111111111111",
    "points": [
      {
        "clientPointId": "22222222-2222-2222-2222-222222222221",
        "recordedAt": "2026-02-25T19:15:00Z",
        "lat": 29.7604,
        "lon": -95.3698,
        "accuracyM": 5.2
      },
      {
        "clientPointId": "22222222-2222-2222-2222-222222222222",
        "recordedAt": "2026-02-25T19:15:05Z",
        "lat": 29.7605,
        "lon": -95.3696,
        "accuracyM": 4.9
      }
    ]
  }'
```

### 8) Poll watch participants (trainer)

```bash
curl -sS http://localhost:8080/v1/sessions/PUT_SESSION_ID_HERE/watch/participants \
  -H 'X-Trainer-Ref: trainer@example.com'
```

### 9) Poll watch tracking (trainer)

```bash
curl -sS 'http://localhost:8080/v1/sessions/PUT_SESSION_ID_HERE/watch/tracking?limit=100' \
  -H 'X-Trainer-Ref: trainer@example.com'
```

### 10) End the session (trainer)

```bash
curl -sS -X POST http://localhost:8080/v1/sessions/PUT_SESSION_ID_HERE/end \
  -H 'X-Trainer-Ref: trainer@example.com'
```
