# Goal
Enable CORS for the Longevity backend so that the frontend (running on http://localhost:5173) can successfully make API requests including Authorization headers.

## Context
The backend is a Fastify server defined in `apps/backend/src/server.ts`.  
We want to register the @fastify/cors plugin **once**, before any route registrations, and correctly allow:
- Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Headers: Authorization, Content-Type

This should be done without breaking existing Swagger setup.

## Tasks
1. Install @fastify/cors in the backend workspace:
npm –workspace apps/backend i @fastify/cors
2. Update `apps/backend/src/server.ts`:
- Add the import:
  ```js
  import cors from "@fastify/cors";
  ```
- Immediately after creating the Fastify instance (`const app = Fastify({ logger: true });`), register the plugin:
  ```js
  await app.register(cors, {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
  });
  ```
- Ensure this registration is **before** any `app.register(...)` calls for routes and swagger.

3. Remove any duplicate registrations of @fastify/cors or incorrect manual CORS handling in other parts of the backend code.

4. Ensure the final file has only one instance of the Fastify CORS registration and no syntax issues (no duplicated `export`, etc.).

## Validation
- Restart the backend:
npm –workspace apps/backend run dev
- From the browser (UI), confirm that requests to `GET /plans/week?weekStart=...` succeed without CORS errors, including Authorization headers.
- Confirm Swagger `/docs` still works.