# COMPONENTS KNOWLEDGE

**Path:** `frontend/src/components/`

## STRUCTURE
```
components/
├── agent/      # AI chat (3 files)
├── effects/    # Visual particles (5 files)
├── music/      # Player UI (3 files)
├── ui/         # Primitives (5 files)
└── widget/     # Clock & Weather (5 files)
```

## EXPORT PATTERN
Named exports only: `export function ComponentName`
Exception: `App.tsx` uses default export

## COMPONENT MAP

| Component | File | Purpose |
|-----------|------|---------|
| MusicPlayer | `music/MusicPlayer.tsx` | Main player, uses BlackHole + AudioVisualizer + MusicParticles |
| TrackList | `music/TrackList.tsx` | Scrollable track list with drag-sort |
| PlaylistImport | `music/PlaylistImport.tsx` | Modal for Netease playlist URL import |
| AgentChat | `agent/AgentChat.tsx` | Chat container with typing indicator |
| ChatMessage | `agent/ChatMessage.tsx` | Glassmorphic message bubbles |
| ChatInput | `agent/ChatInput.tsx` | Auto-growing input with send button |
| StarField | `effects/StarField.tsx` | 400 parallax stars, twinkle animation |
| Aurora | `effects/Aurora.tsx` | Flowing gradient with noise distortion |
| BlackHole | `effects/BlackHole.tsx` | Rotating halo, pulses on playback |
| AudioVisualizer | `effects/AudioVisualizer.tsx` | Circular frequency bars |
| MusicParticles | `effects/MusicParticles.tsx` | Canvas: gather + explode with beat |
| Button | `ui/Button.tsx` | Variants: primary, ghost, icon, gradient |
| Modal | `ui/Modal.tsx` | Backdrop blur, animated overlay |
| Slider | `ui/Slider.tsx` | Range input with progress fill |
| Toast | `ui/Toast.tsx` | Sonner toast provider |
| TabNavigation | `ui/TabNavigation.tsx` | Mobile bottom nav + DesktopView/MobileView |
| ClockWidget | `widget/ClockWidget.tsx` | Digital clock with aurora gradient |
| WeatherWidget | `widget/WeatherWidget.tsx` | Current weather with glassmorphism |
| WeatherForecast | `widget/WeatherForecast.tsx` | 5-day forecast strip |
| ClockWeatherPanel | `widget/ClockWeatherPanel.tsx` | Combined clock + weather container |

## CONVENTIONS
- All use Tailwind classes (no CSS modules)
- CSS variables for theme colors (from globals.css)
- `glass-card` class for glassmorphism panels
- `backdrop-blur-*` for frosted glass effect
- framer-motion for complex animations
- React `useState` for local state only

## PROPS PATTERNS
```typescript
// Interface at top (preferred)
interface ComponentProps { ... }

// Or inline for simple cases
function Component({ prop1, prop2 }: { prop1: string; prop2?: number })
```

## MOCK DATA
- `MOCK_TRACKS` in MusicPlayer.tsx
- `MOCK_MESSAGES` in AgentChat.tsx
- `MOCK_WEATHER` in useWeather.ts
- `MOCK_FORECAST` in WeatherForecast.tsx
