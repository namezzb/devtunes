import { Router, Request, Response } from 'express';
import { createMusicSource } from '../services/music-source-factory.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query || query.trim() === '') {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    const limit = parseInt(req.query.limit as string, 10) || 20;
    const musicSource = createMusicSource();
    const result = await musicSource.searchSongs(query, limit);
    res.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
