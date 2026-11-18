# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault is an online platform for playing games and competing for the highest score. It is at the scaffold stage (fresh `create-next-app` output), so most of the architecture is still to be built.

Development follows **Spec Driven Design** using the `/spec` and `/spec-impl` skills from [Klerith/fernando-skills](https://github.com/Klerith/fernando-skills) (install with `npx skills@latest add Klerith/fernando-skills`). New features should start from a spec before implementation.

## Commands

- `npm run dev` — dev server at http://localhost:3000 (Turbopack)
- `npm run build` — production build (also type-checks)
- `npm run start` — serve the production build
- `npm run lint` — ESLint (flat config, `eslint-config-next` core-web-vitals + typescript)

There is no test runner configured yet.

## Skills
Usa siempre /frontend-design para los diseños.

## Stack and conventions

- **Next.js 16.4 App Router**, React 19.3, TypeScript strict. This Next version differs from older releases. Check `node_modules/next/dist/docs/` before using any Next API (see AGENTS.md).
- **`next.config.ts` enables non-default behavior** that shapes how pages must be written:
  - `cacheComponents: true`: Cache Components model (`"use cache"`, dynamic data behind `<Suspense>`). See `01-app/01-getting-started/08-caching.md` and `02-guides/migrating-to-cache-components.md` in the Next docs.
  - `partialPrefetching: true`: see `02-guides/optimizing-prefetching.md`.
  - `experimental.agentFeedback: true`: see `02-guides/ai-agents.md`.
- **Tailwind CSS v4**, loaded through a Turbopack rule (`@tailwindcss/turbopack` loader on `*.css`), not PostCSS. There is no `tailwind.config`. Theme tokens are declared in `app/globals.css` via `@theme inline` and CSS variables (light/dark via `prefers-color-scheme`).
- Import alias `@/*` maps to the repo root.
- Route typing helpers such as `LayoutProps<"/">` are globally available (generated types in `.next/types`).
