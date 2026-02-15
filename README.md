# Longevity Workout Backend (MVP)

## Requirements
- Node 20+
- PostgreSQL (Supabase)

## Environment Variables
Create `apps/backend/.env`:

```env
DATABASE_URL=postgresql://...
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
PORT=3000
```

## Install
```bash
npm install
```

## Prisma
```bash
npm --workspace apps/backend run prisma:generate
npm --workspace apps/backend run prisma:migrate
npm --workspace apps/backend run prisma:seed
```

## Run backend
```bash
npm --workspace apps/backend run dev
```

## Build + start
```bash
npm run build
npm --workspace apps/backend run start
```

## Run tests
```bash
npm test
```

## API Endpoints
- `POST /sessions/generate`
- `POST /sessions/:id/submit`
- `POST /sessions/:id/swap`
- `POST /readiness`
- `GET /plans/week`

All endpoints require `Authorization: Bearer <supabase_jwt>`.
