import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApp } from '../src/app.js';
import express, { Express } from 'express';

describe('App', () => {
  let app: Express;

  beforeEach(() => {
    app = createApp();
  });

  describe('Health Check', () => {
    it('should return ok status', async () => {
      const http = await import('http');
      const server = http.createServer(app);

      await new Promise<void>((resolve) => server.listen(0, resolve));
      const port = (server.address() as { port: number }).port;

      try {
        const response = await fetch(`http://localhost:${port}/health`);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.status).toBe('ok');
        expect(body.timestamp).toBeDefined();
      } finally {
        server.close();
      }
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const http = await import('http');
      const server = http.createServer(app);

      await new Promise<void>((resolve) => server.listen(0, resolve));
      const port = (server.address() as { port: number }).port;

      try {
        const response = await fetch(`http://localhost:${port}/unknown-route`);
        const body = await response.json();

        expect(response.status).toBe(404);
        expect(body.error).toBe('Not Found');
      } finally {
        server.close();
      }
    });
  });

  describe('Error Handler', () => {
    it('should handle errors gracefully when Express throws', async () => {
      const testApp = express();
      testApp.get('/error', (_req, _res) => {
        throw new Error('Test error');
      });

      const { errorHandler } = await import('../src/app.js');
      testApp.use(errorHandler);

      const http = await import('http');
      const server = http.createServer(testApp);

      await new Promise<void>((resolve) => server.listen(0, resolve));
      const port = (server.address() as { port: number }).port;

      try {
        const response = await fetch(`http://localhost:${port}/error`);
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body.error).toBe('Internal Server Error');
        expect(body.message).toBe('Test error');
      } finally {
        server.close();
      }
    });
  });
});
