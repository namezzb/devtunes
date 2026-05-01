# PROJECT KNOWLEDGE BASE

**Generated:** 2026-05-01
**Commit:** a2122a4
**Branch:** main

## OVERVIEW
DEVTunes - Music + AI Agent webapp for developers. React + TypeScript + Vite frontend with Express + TypeScript backend. Cosmic visual effects, Netease Cloud Music integration, and Claude Code AI chat.

## STRUCTURE
```
devtunes/
├── frontend/           # React SPA (Vite + Tailwind + Playwright E2E)
│   └── src/
│       ├── components/ # Feature-grouped UI components
│       ├── context/    # React context (AppContext)
│       ├── hooks/      # Custom hooks (useChat, usePlaylist, etc.)
│       ├── services/   # API client (api.ts)
│       ├── styles/     # globals.css with CSS vars
│       ├── utils/      # urlResolver.ts
│       ├── App.tsx     # Root layout
│       └── main.tsx    # Entry point
├── backend/            # Express API (TypeScript + Vitest)
│   ├── src/routes/     # API endpoints
│   ├── src/services/   # Business logic
│   └── tests/          # Unit tests
├── bugfixes/           # Gitignored - local dev scratch
├── DEVTunes-Product-Spec.md
└── README.md
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Visual effects | `frontend/src/components/effects/` | StarField, Aurora, BlackHole, MusicParticles |
| Music player | `frontend/src/components/music/` | MusicPlayer, TrackList, PlaylistImport |
| AI chat | `frontend/src/components/agent/` | AgentChat, ChatMessage, ChatInput |
| UI primitives | `frontend/src/components/ui/` | Button, Modal, Slider, Toast, TabNavigation |
| API client | `frontend/src/services/api.ts` | Playlist, search, chat streaming, TTS |
| State mgmt | `frontend/src/hooks/` | useChat, usePlaylist, useKeyboardShortcuts |
| Backend routes | `backend/src/routes/` | playlist, song, search, chat, tts |
| Backend services | `backend/src/services/` | netease.ts, urlResolver.ts |
| CSS variables | `frontend/src/styles/globals.css` | Aurora colors, glassmorphism |
| E2E tests | `frontend/e2e/` | Playwright: devtunes, chat, music-player |
| Unit tests | `backend/tests/` | Vitest: app, routes, services |

## CONVENTIONS (THIS PROJECT)
- **Named exports** for components (`export function Component`)
- **Props interfaces** defined at file top or inline
- **CSS variables** from `globals.css` (not Tailwind defaults)
- **No path aliases** - all imports use relative paths
- **noUnusedLocals/Parameters: false** - TS relaxed for MVP

## ANTI-PATTERNS (THIS PROJECT)
- No inline `console.log` in production code
- No `any` type unless absolutely necessary (`@typescript-eslint/no-explicit-any: warn`)

## COMMANDS
```bash
# Frontend
cd frontend
npm install
npm run dev        # Start dev server (port 5173)
npm run build      # TypeScript + Vite build
npm run lint       # ESLint check
npm run preview    # Preview production build
npm run test:e2e   # Playwright E2E tests

# Backend
cd backend
npm install
npm run dev        # Start dev server (port 3001, tsx watch)
npm run build      # tsc compile to dist/
npm run test       # Vitest unit tests
npm run test:watch # Vitest watch mode
```

## NOTES
- **E2E tests** - Playwright configured (frontend/e2e/)
- **Backend tests** - Vitest with v8 coverage (backend/tests/)
- **No Prettier** - ESLint only (flat config v9+)
- **Mock data** in components for demo (MOCK_TRACKS, MOCK_MESSAGES)
- **Vite proxy** - /api -> localhost:3001 in dev
- **Claude Code** - backend routes/chat.ts spawns local claude CLI for AI chat
- **Netease API** - backend proxies to external NeteaseCloudMusicApi (port 3000)
