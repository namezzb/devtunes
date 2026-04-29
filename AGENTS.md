# PROJECT KNOWLEDGE BASE

**Generated:** 2026-04-29
**Commit:** c59aed3
**Branch:** main

## OVERVIEW
DEVTunes - Music + AI Agent webapp for developers. React + TypeScript + Vite frontend with cosmic visual effects.

## STRUCTURE
```
devtunes/
├── frontend/           # React SPA (Vite + Tailwind)
│   └── src/
│       ├── components/ # Feature-grouped UI components
│       ├── styles/    # globals.css with CSS vars
│       ├── App.tsx    # Root layout (StarField + Aurora)
│       └── main.tsx   # Entry point
├── backend/            # (future) Node.js API
├── DEVTunes-Product-Spec.md
└── README.md
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Visual effects | `frontend/src/components/effects/` | StarField, Aurora, BlackHole, MusicParticles |
| Music player | `frontend/src/components/music/` | MusicPlayer, TrackList, PlaylistImport |
| AI chat | `frontend/src/components/agent/` | AgentChat, ChatMessage, ChatInput |
| UI primitives | `frontend/src/components/ui/` | Button, Modal, Slider |
| CSS variables | `frontend/src/styles/globals.css` | Aurora colors, glassmorphism |

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
cd frontend
npm install
npm run dev      # Start dev server
npm run build    # TypeScript + Vite build
npm run lint     # ESLint check
npm run preview # Preview production build
```

## NOTES
- **No tests** - testing infrastructure not configured
- **No Prettier** - ESLint only (flat config v9+)
- **Mock data** in components for demo (MOCK_TRACKS, MOCK_MESSAGES)
- **Backend not started** - NeteaseCloudMusicApi + Claude Code integration TODO
