# Task: Add Swagger UI to Fastify Server

## Goal
Modify the Fastify backend to register Swagger and Swagger UI.

## File to Update
`apps/backend/src/server.ts`

## Change
Add imports at the top:
```ts
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
```

After the Fastify app is created (e.g., `const app = Fastify({...})`), register Swagger:

```ts
await app.register(swagger, {
  openapi: {
    info: {
      title: "Longevity API",
      version: "1.0.0",
    },
  },
});

await app.register(swaggerUI, {
  routePrefix: "/docs",
});
```

## Acceptance Criteria
- Swagger and Swagger UI are registered before routes.
- Running the server exposes `/docs` with interactive API docs.
- `server.ts` compiles and runs without TypeScript errors.
