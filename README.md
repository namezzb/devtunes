# DEVTunes

> Music + AI Agent for Developers

A cosmic-themed music player with AI assistant, designed for developers who want background music and an intelligent coding companion.

## Tech Stack

**Frontend**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- Framer Motion (animations)

**Backend** (coming soon)
- Node.js + Express
- NeteaseCloudMusicApi (music source)
- Claude Code CLI (AI integration)
- Fish Audio (voice synthesis)

## Features

- [x] Cosmic visual effects (star field, aurora, black hole)
- [x] Audio visualization with particle effects
- [x] Premium glassmorphism chat UI
- [x] Music player with playlist import
- [ ] Netease Cloud Music integration
- [ ] AI Agent chat with Claude Code
- [ ] Voice synthesis with Fish Audio
- [ ] Backend API

## Project Structure

```
devtunes/
├── frontend/           # React + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   ├── agent/      # AI chat components
│   │   │   ├── effects/    # Visual effects
│   │   │   ├── music/      # Music player
│   │   │   └── ui/         # UI primitives
│   │   ├── styles/
│   │   └── App.tsx
│   └── ...
├── backend/             # (future) Node.js API
├── DEVTunes-Product-Spec.md
└── README.md
```

## Getting Started

```bash
cd frontend
npm install
npm run dev
```

## License

MIT
