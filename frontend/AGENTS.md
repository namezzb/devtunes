# FRONTEND KNOWLEDGE

**Path:** `frontend/`

## OVERVIEW
React + TypeScript + Vite SPA. Cosmic UI with framer-motion animations and Tailwind CSS.

## TECH STACK
| Layer | Tech | Version |
|-------|------|---------|
| Framework | React | 18.2 |
| Build | Vite | 5.1 |
| Language | TypeScript | 5.2 (strict) |
| Styling | Tailwind CSS | 3.4 |
| Animations | framer-motion | 11 |
| Linting | ESLint (flat) | 9 + typescript-eslint |

## CONFIG FILES
| File | Purpose |
|------|---------|
| `vite.config.ts` | React plugin only, minimal |
| `tsconfig.json` | ES2020, react-jsx, bundler moduleResolution |
| `eslint.config.js` | Flat config: @eslint/js + typescript-eslint + react-hooks |
| `tailwind.config.js` | Default theme, no extensions |
| `postcss.config.js` | Autoprefixer |

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
- `src/main.tsx` - React mount
- `src/App.tsx` - Root layout (StarField + Aurora background, 2-column grid)

## NO EXTERNAL SERVICES YET
- No API calls (mock data only)
- No authentication
- No database (IndexedDB TODO)
