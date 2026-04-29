import { Router, Request, Response } from 'express';
import { neteaseService } from '../services/netease.js';

const router = Router();

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid playlist ID' });
      return;
    }

    const playlist = await neteaseService.getPlaylist(id);
    res.json({ success: true, data: playlist });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.get('/:id/tracks', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid playlist ID' });
      return;
    }

    const result = await neteaseService.getPlaylistTracks(id);
    res.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
