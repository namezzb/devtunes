# BACKEND KNOWLEDGE

**Path:** `backend/`

## OVERVIEW
Express + TypeScript API server. Proxies Netease Cloud Music, spawns Claude CLI for AI chat streaming, and provides TTS endpoints.

## TECH STACK
| Layer | Tech | Version |
|-------|------|---------|
| Framework | Express | 4.18 |
| Language | TypeScript | 5.3 |
| Runtime | Node.js | >=20 |
| Dev | tsx | 4.7 |
| Testing | Vitest | 1.2 |
| HTTP Client | axios | 1.6 |

## CONFIG FILES
| File | Purpose |
|------|---------|
| `tsconfig.json` | ES2022, NodeNext, outDir ./dist, strict |
| `vitest.config.ts` | Node env, globals, v8 coverage |

## ENTRY POINTS
- `src/server.ts` - Boots Express on PORT (default 3001)
- `src/app.ts` - `createApp()` factory: middleware, routes, error handling

## ROUTES
| Route | File | Purpose |
|-------|------|---------|
| `/api/playlist` | `routes/playlist.ts` | Playlist detail, tracks, proxy |
| `/api/song` | `routes/song.ts` | Song URL, lyric |
| `/api/search` | `routes/search.ts` | Search songs |
| `/api/chat` | `routes/chat.ts` | Claude CLI spawn + SSE streaming |
| `/api/tts` | `routes/tts.ts` | Text-to-speech via Fish Audio |

## SERVICES
| Service | File | Purpose |
|---------|------|---------|
| Netease | `services/netease.ts` | NeteaseCloudMusicApi client, data transformation |
| URL Resolver | `services/urlResolver.ts` | Short/mobile URL resolution |

## CONVENTIONS
- Named exports for factories (`export function createApp`)
- Express routers in separate files under `routes/`
- Business logic in `services/` classes
- `console.error` for errors (MVP - should use structured logger)
- Test files co-located in `tests/` (not alongside source)

## COMMANDS
```bash
cd backend
npm install
npm run dev        # tsx watch (port 3001)
npm run build      # tsc -> dist/
npm run test       # Vitest run
npm run test:watch # Vitest watch
```

## NOTES
- **Claude CLI path** hardcoded in `routes/chat.ts` - should be env var
- **Netease API** requires external service on port 3000
- **SSE streaming** for chat - no heartbeat mechanism yet
- **Tests** spin up real HTTP servers on ephemeral ports
