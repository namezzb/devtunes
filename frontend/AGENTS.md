# FRONTEND KNOWLEDGE

**Path:** `frontend/`

## OVERVIEW
React + TypeScript + Vite SPA. Cosmic UI with framer-motion animations and Tailwind CSS. Playwright E2E testing.

## TECH STACK
| Layer | Tech | Version |
|-------|------|---------|
| Framework | React | 18.2 |
| Build | Vite | 5.1 |
| Language | TypeScript | 5.2 (strict) |
| Styling | Tailwind CSS | 3.4 |
| Animations | framer-motion | 11 |
| Linting | ESLint (flat) | 9 + typescript-eslint |
| E2E | Playwright | 1.59 |
| DnD | @dnd-kit | core + sortable |

## CONFIG FILES
| File | Purpose |
|------|---------|
| `vite.config.ts` | React plugin, /api proxy to localhost:3001 |
| `tsconfig.json` | ES2020, react-jsx, bundler moduleResolution |
| `eslint.config.js` | Flat config: @eslint/js + typescript-eslint + react-hooks |
| `tailwind.config.js` | Default theme, no extensions |
| `postcss.config.js` | Autoprefixer |
| `playwright.config.ts` | Chromium + Mobile Safari, HTML reporter |

## CSS VARIABLES (globals.css)
```css
--bg-deep: #050510        /* Main background */
--aurora-start: #00ffd1    /* Cyan - accent */
--aurora-mid: #8b5cf6      /* Violet - secondary */
--aurora-end: #ec4899      /* Pink - tertiary */
--text-primary: rgba(255,255,255,0.95)
--text-secondary: rgba(255,255,255,0.7)
--text-muted: rgba(255,255,255,0.4)
```

## ENTRY POINTS
- `index.html` - SPA entry
- `src/main.tsx` - React mount (StrictMode)
- `src/App.tsx` - Root layout (StarField + Aurora, DesktopView + MobileView)

## DIRECTORY STRUCTURE
```
src/
├── components/  # UI components (feature-grouped)
├── context/     # React context (AppContext)
├── hooks/       # Custom hooks (useChat, usePlaylist, etc.)
├── services/    # API client (api.ts)
├── styles/      # globals.css with CSS vars
└── utils/       # urlResolver.ts
```

## API INTEGRATION
- **Vite proxy** - /api -> localhost:3001 in dev
- **services/api.ts** - Fetch wrappers for playlist, search, chat streaming, TTS
- **Mock data** - MOCK_TRACKS, MOCK_MESSAGES as fallback

## E2E TESTING
- **Location** - `e2e/` directory
- **Framework** - Playwright
- **Browsers** - Chromium + Mobile Safari (iPhone 12)
- **Run** - `npm run test:e2e`

## NOTES
- No authentication
- No database (IndexedDB TODO)
- No Prettier - ESLint only
