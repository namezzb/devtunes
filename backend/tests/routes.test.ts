import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('Playlist Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/playlist/:id', () => {
    it('should return 400 for invalid playlist ID', async () => {
      const { createApp } = await import('../src/app.js');
      const app = createApp();
      const http = await import('http');
      const server = http.createServer(app);

      await new Promise<void>((resolve) => server.listen(0, resolve));
      const port = (server.address() as { port: number }).port;

      try {
        const response = await fetch(`http://localhost:${port}/api/playlist/invalid`);
        expect(response.status).toBe(400);
      } finally {
        server.close();
      }
    });

    it('should handle Netease API errors gracefully', async () => {
      mockedAxios.create?.mockReturnValue({
        get: vi.fn().mockResolvedValue({ data: { code: 400, msg: 'Test error' } }),
      } as any);

      const { createApp } = await import('../src/app.js');
      const app = createApp();
      const http = await import('http');
      const server = http.createServer(app);

      await new Promise<void>((resolve) => server.listen(0, resolve));
      const port = (server.address() as { port: number }).port;

      try {
        const response = await fetch(`http://localhost:${port}/api/playlist/123`);
        expect(response.status).toBe(500);
      } finally {
        server.close();
      }
    });
  });
});

describe('Song Routes', () => {
  describe('GET /api/song/:id/url', () => {
    it('should return 400 for invalid song ID', async () => {
      const { createApp } = await import('../src/app.js');
      const app = createApp();
      const http = await import('http');
      const server = http.createServer(app);

      await new Promise<void>((resolve) => server.listen(0, resolve));
      const port = (server.address() as { port: number }).port;

      try {
        const response = await fetch(`http://localhost:${port}/api/song/invalid/url`);
        expect(response.status).toBe(400);
      } finally {
        server.close();
      }
    });
  });

  describe('GET /api/song/:id/lyric', () => {
    it('should return 400 for invalid song ID', async () => {
      const { createApp } = await import('../src/app.js');
      const app = createApp();
      const http = await import('http');
      const server = http.createServer(app);

      await new Promise<void>((resolve) => server.listen(0, resolve));
      const port = (server.address() as { port: number }).port;

      try {
        const response = await fetch(`http://localhost:${port}/api/song/invalid/lyric`);
        expect(response.status).toBe(400);
      } finally {
        server.close();
      }
    });
  });
});

describe('Search Routes', () => {
  describe('GET /api/search', () => {
    it('should return 400 when query is missing', async () => {
      const { createApp } = await import('../src/app.js');
      const app = createApp();
      const http = await import('http');
      const server = http.createServer(app);

      await new Promise<void>((resolve) => server.listen(0, resolve));
      const port = (server.address() as { port: number }).port;

      try {
        const response = await fetch(`http://localhost:${port}/api/search`);
        expect(response.status).toBe(400);
      } finally {
        server.close();
      }
    });

    it('should return 400 when query is empty', async () => {
      const { createApp } = await import('../src/app.js');
      const app = createApp();
      const http = await import('http');
      const server = http.createServer(app);

      await new Promise<void>((resolve) => server.listen(0, resolve));
      const port = (server.address() as { port: number }).port;

      try {
        const response = await fetch(`http://localhost:${port}/api/search?q=`);
        expect(response.status).toBe(400);
      } finally {
        server.close();
      }
    });
  });
});

describe('Chat Routes', () => {
  describe('POST /api/chat', () => {
    it('should return 400 when message is missing', async () => {
      const { createApp } = await import('../src/app.js');
      const app = createApp();
      const http = await import('http');
      const server = http.createServer(app);

      await new Promise<void>((resolve) => server.listen(0, resolve));
      const port = (server.address() as { port: number }).port;

      try {
        const response = await fetch(`http://localhost:${port}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        expect(response.status).toBe(400);
      } finally {
        server.close();
      }
    });

    it('should return 400 when message is empty', async () => {
      const { createApp } = await import('../src/app.js');
      const app = createApp();
      const http = await import('http');
      const server = http.createServer(app);

      await new Promise<void>((resolve) => server.listen(0, resolve));
      const port = (server.address() as { port: number }).port;

      try {
        const response = await fetch(`http://localhost:${port}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: '   ' }),
        });
        expect(response.status).toBe(400);
      } finally {
        server.close();
      }
    });
  });
});

describe('TTS Routes', () => {
  describe('GET /api/tts/voices', () => {
    it('should return list of available voices', async () => {
      const { createApp } = await import('../src/app.js');
      const app = createApp();
      const http = await import('http');
      const server = http.createServer(app);

      await new Promise<void>((resolve) => server.listen(0, resolve));
      const port = (server.address() as { port: number }).port;

      try {
        const response = await fetch(`http://localhost:${port}/api/tts/voices`);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toBeInstanceOf(Array);
        expect(body.data.length).toBeGreaterThan(0);
        expect(body.data[0]).toHaveProperty('id');
        expect(body.data[0]).toHaveProperty('name');
        expect(body.data[0]).toHaveProperty('language');
      } finally {
        server.close();
      }
    });
  });

  describe('POST /api/tts', () => {
    it('should return 400 when text is missing', async () => {
      const { createApp } = await import('../src/app.js');
      const app = createApp();
      const http = await import('http');
      const server = http.createServer(app);

      await new Promise<void>((resolve) => server.listen(0, resolve));
      const port = (server.address() as { port: number }).port;

      try {
        const response = await fetch(`http://localhost:${port}/api/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        expect(response.status).toBe(400);
      } finally {
        server.close();
      }
    });

    it('should return 503 when API key is not configured', async () => {
      const { createApp } = await import('../src/app.js');
      const app = createApp();
      const http = await import('http');
      const server = http.createServer(app);

      await new Promise<void>((resolve) => server.listen(0, resolve));
      const port = (server.address() as { port: number }).port;

      try {
        const response = await fetch(`http://localhost:${port}/api/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'Hello world' }),
        });
        expect(response.status).toBe(503);
        const body = await response.json();
        expect(body.error).toContain('API key not configured');
      } finally {
        server.close();
      }
    });
  });
});
