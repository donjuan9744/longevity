# Goal
Scaffold a new UI application under apps/web using a modern frontend stack.

## Description
In the existing longevity monorepo:

- Create a new folder: `apps/web`
- Inside `apps/web`, bootstrap a new **React + TypeScript + Vite** application
- Install dependencies needed for a basic UI:
  - react
  - react-dom
  - typescript
  - vite
  - @types/react, @types/react-dom
- Ensure the new project is part of the monorepo's workspaces (no changes to root package.json required if using existing "apps/*" pattern)
- Provide working scripts:
  ```
  npm --workspace apps/web run dev
  npm --workspace apps/web run build
  npm --workspace apps/web run preview
  ```
- Create a basic home page (e.g., “Hello Longevity UI”)
- Create a placeholder folder structure:
  - `apps/web/src/pages`
  - `apps/web/src/components`
  - `apps/web/src/api`
  - `apps/web/src/styles`
- Add a README under `apps/web/README.md` explaining how to run and develop the UI
- Do not break existing engine or backend functionality

## Expectations
- The dev server should start at something like http://localhost:5173
- Visiting the URL should show the home page with a welcome message
- The project should use React + TS with Vite, with minimal but functional configuration

## Tests (optional)
- Confirm that running `npm --workspace apps/web run dev` starts a dev server
- Confirm that the home page loads in the browser without errors

## Quality
- Follow best practices for React + TypeScript + Vite
- Keep the project file structure clean and intuitive
- Don’t introduce unnecessary complexity or heavy UI frameworks (keep it lightweight)