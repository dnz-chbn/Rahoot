# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rahoot is an open-source Kahoot! clone — a real-time multiplayer quiz platform using WebSockets. Players join via room codes, managers control the game flow.

## Commands

```bash
pnpm install          # Install all dependencies
pnpm run dev          # Run web + socket servers concurrently (dev mode)
pnpm run dev:web      # Run only Next.js frontend
pnpm run dev:socket   # Run only Socket.IO backend
pnpm run build        # Build all packages
pnpm start            # Start all packages (production)
pnpm run lint         # Lint all packages
pnpm run clean        # Remove dist and node_modules from all packages
```

No test framework is configured.

## Architecture

**Monorepo** (pnpm workspaces) with three packages:

- **`packages/web`** — Next.js 16 (App Router, standalone output) frontend with Zustand stores, Socket.IO client, Tailwind CSS, Motion animations
- **`packages/socket`** — Socket.IO server handling game logic, quiz CRUD, player/manager events. Uses esbuild for bundling.
- **`packages/common`** — Shared Zod validators and Socket.IO type definitions (no build step)

### Deployment Model

In production (Docker), `server.js` at repo root monkey-patches `http.Server.prototype.listen` to attach Socket.IO handlers to the Next.js HTTP server, running everything on a single port (3000). In development, web and socket run on separate ports.

### Game State Flow

Registry (singleton) → Game instances (in-memory) → Socket.IO rooms. Games auto-cleanup after 5 minutes when empty. Players and managers support reconnection via `clientId`.

### Data Storage

- **Firestore** (optional): Set `FIREBASE_SERVICE_ACCOUNT` env var. Seeds from `config/quizz/*.json` on first run.
- **File-based fallback**: Reads quizzes from `config/quizz/*.json` and game config from `config/game.json`.

### State Management (Frontend)

Three Zustand stores in `packages/web/src/stores/`: `manager.tsx`, `player.tsx`, `question.tsx`. Socket connection managed via React context in `contexts/socketProvider.tsx`.

### Routing

- `/` — Player join (enter room code)
- `/manager` — Manager login + quiz selection
- `/game/[gameId]` — Player game view
- `/game/manager/[gameId]` — Manager game control

## Code Style

- **No semicolons**, double quotes, 2-space indent, trailing commas
- Arrow functions preferred, `const` preferred, destructuring preferred
- Prettier with Tailwind class sorting plugin
- ESLint: strict TypeScript-checked rules, max depth 3, max params 4, no TODO comments, capitalized comments

## Key Environment Variables

- `WEB_ORIGIN` — CORS origin (default: `http://localhost:3000`)
- `SOCKET_URL` — WebSocket URL (default: `http://localhost:3001`)
- `CONFIG_PATH` — Path to config directory
- `FIREBASE_SERVICE_ACCOUNT` — Optional Firebase credentials JSON
