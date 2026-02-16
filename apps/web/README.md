# @longevity/web

UI application for the Longevity monorepo using React, TypeScript, and Vite.

## Prerequisites

- Node.js 18+
- npm 10+

## Install dependencies

From the repository root:

```bash
npm install
```

## Run the app

From the repository root:

```bash
npm --workspace apps/web run dev
```

Vite starts the development server on `http://localhost:5173` by default.

## Build for production

```bash
npm --workspace apps/web run build
```

## Preview production build

```bash
npm --workspace apps/web run preview
```

## Structure

```text
apps/web/
  src/
    api/
    components/
    pages/
    styles/
```
