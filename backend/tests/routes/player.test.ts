import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../../src/app.js';
import type { Express } from 'express';
import http from 'http';
import { playerStateService } from '../../src/services/player-state.js';

function getServer(app: Express) {
  return new Promise<{ port: number; server: http.Server }>((resolve) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = (server.address() as { port: number }).port;
      resolve({ port, server });
    });
  });
}

describe('Player Routes', () => {
  let app: Express;

  beforeEach(() => {
    playerStateService.setState({
      currentTrack: null,
      isPlaying: false,
      progress: 0,
      duration: 0,
      volume: 0.8,
      playlist: [],
      currentIndex: -1,
      playMode: 'list',
      timestamp: Date.now(),
    });
    app = createApp();
  });

  describe('GET /api/player/state', () => {
    it('should return current playback state', async () => {
      const { port, server } = await getServer(app);
      try {
        const response = await fetch(`http://localhost:${port}/api/player/state`);
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.data).toMatchObject({
          isPlaying: false,
          volume: 0.8,
          playMode: 'list',
          currentTrack: null,
          playlist: [],
        });
      } finally {
        server.close();
      }
    });
  });

  describe('PATCH /api/player/state', () => {
    it('should update state partially', async () => {
      const { port, server } = await getServer(app);
      try {
        const response = await fetch(`http://localhost:${port}/api/player/state`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPlaying: true, volume: 0.5 }),
        });
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.data.isPlaying).toBe(true);
        expect(body.data.volume).toBe(0.5);
      } finally {
        server.close();
      }
    });

    it('should reject unknown fields', async () => {
      const { port, server } = await getServer(app);
      try {
        const response = await fetch(`http://localhost:${port}/api/player/state`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ unknownField: 'test' }),
        });
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('Unknown fields');
      } finally {
        server.close();
      }
    });

    it('should reject non-object body', async () => {
      const { port, server } = await getServer(app);
      try {
        const response = await fetch(`http://localhost:${port}/api/player/state`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify('invalid'),
        });
        // express.json() with strict mode rejects non-object top-level values
        expect(response.status).toBe(500);
      } finally {
        server.close();
      }
    });
  });

  describe('POST /api/player/action', () => {
    it('should play', async () => {
      const { port, server } = await getServer(app);
      try {
        const response = await fetch(`http://localhost:${port}/api/player/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'play' }),
        });
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.data.isPlaying).toBe(true);
      } finally {
        server.close();
      }
    });

    it('should pause', async () => {
      const { port, server } = await getServer(app);
      try {
        const response = await fetch(`http://localhost:${port}/api/player/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'pause' }),
        });
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.data.isPlaying).toBe(false);
      } finally {
        server.close();
      }
    });

    it('should handle next with empty playlist', async () => {
      const { port, server } = await getServer(app);
      try {
        const response = await fetch(`http://localhost:${port}/api/player/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'next' }),
        });
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.data).toBeDefined();
      } finally {
        server.close();
      }
    });

    it('should handle prev with empty playlist', async () => {
      const { port, server } = await getServer(app);
      try {
        const response = await fetch(`http://localhost:${port}/api/player/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'prev' }),
        });
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.data).toBeDefined();
      } finally {
        server.close();
      }
    });

    it('should seek to position', async () => {
      const { port, server } = await getServer(app);
      try {
        const response = await fetch(`http://localhost:${port}/api/player/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'seek', payload: { position: 42 } }),
        });
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.data.progress).toBe(42);
      } finally {
        server.close();
      }
    });

    it('should return 400 for seek without position', async () => {
      const { port, server } = await getServer(app);
      try {
        const response = await fetch(`http://localhost:${port}/api/player/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'seek' }),
        });
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('position');
      } finally {
        server.close();
      }
    });

    it('should return 400 for invalid action', async () => {
      const { port, server } = await getServer(app);
      try {
        const response = await fetch(`http://localhost:${port}/api/player/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'invalid' }),
        });
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('Invalid action');
      } finally {
        server.close();
      }
    });

    it('should return 400 when action is missing', async () => {
      const { port, server } = await getServer(app);
      try {
        const response = await fetch(`http://localhost:${port}/api/player/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.success).toBe(false);
      } finally {
        server.close();
      }
    });
  });
});
