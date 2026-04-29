import { Router, Request, Response } from 'express';
import { neteaseService } from '../services/netease.js';

const router = Router();

router.get('/:id/url', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid song ID' });
      return;
    }

    const url = await neteaseService.getSongUrl(id);
    res.json({ success: true, data: { id, url } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.get('/:id/lyric', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid song ID' });
      return;
    }

    const lyric = await neteaseService.getLyric(id);
    res.json({ success: true, data: lyric });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
