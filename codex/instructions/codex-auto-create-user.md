Goal:
Ensure that whenever a request is authenticated, a corresponding User row exists in the database.

Tasks:

1. Locate authMiddleware in apps/backend/src.
2. After decoding the token and extracting request.user.id:
   - Upsert a User row using Prisma.
   - Use the user id from the token as the primary key.
   - If email is available, store it.
   - If not, set email to a placeholder like `${id}@local.dev`.

3. Do NOT modify any route logic.
4. Do NOT modify engine logic.
5. Do NOT modify schema.

Implementation requirements:

- Use prisma.user.upsert.
- Do not overwrite existing users.
- Keep middleware clean and minimal.
- Ensure TypeScript passes.
- Run build and tests.

Result:
Authenticated requests automatically create a User row if it does not already exist.