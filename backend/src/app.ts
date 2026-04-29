import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import playlistRouter from './routes/playlist.js';
import songRouter from './routes/song.js';
import searchRouter from './routes/search.js';
import chatRouter from './routes/chat.js';
import ttsRouter from './routes/tts.js';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors());
  // JSON parsing applied per-router for routes that need it

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/api/playlist', playlistRouter);
  app.use('/api/song', songRouter);
  app.use('/api/search', searchRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/tts', ttsRouter);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
  });

  // Error handler
  const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  };
  app.use(errorHandler);

  return app;
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
}
