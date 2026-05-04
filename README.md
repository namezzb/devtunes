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

## Backend Setup

The playlist import feature requires NeteaseCloudMusicApi to be running. The frontend proxies requests to this API.

### Option 1: Docker (Recommended)

```bash
docker run -d -p 3000:3000 neteasecloudmusicapienhanced/api-enhanced
```

### Option 2: Node.js

```bash
git clone https://github.com/nicejji/NeteaseCloudMusicApi.git
cd NeteaseCloudMusicApi
npm install
node app.js
```

### Environment Variable

Set this environment variable for the frontend to connect to the API:

```bash
NETEASE_API_BASE=http://localhost:3000
```

## Troubleshooting

- **Playlist import fails**: Ensure the NeteaseCloudMusicApi is running on port 3000. Check that no other process is using that port.
- **Songs not loading**: Verify the `NETEASE_API_BASE` environment variable is set correctly and the API is healthy.
- **CORS errors**: The API should be accessible from `http://localhost:5173` (Vite dev server) or your deployed frontend URL.

## License

MIT
