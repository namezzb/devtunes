import { Router, Request, Response } from 'express';
import { createMusicSource } from '../services/music-source-factory.js';

const router = Router();

function isValidTrackId(id: string): boolean {
  if (/^[0-9]+$/.test(id)) return true;
  if (/^[a-f0-9]{32}$/i.test(id)) return true;
  return false;
}

router.get('/:id/url', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!isValidTrackId(id)) {
      res.status(400).json({ error: 'Invalid song ID' });
      return;
    }
    const musicSource = createMusicSource();
    const url = await musicSource.getTrackUrl(id);
    res.json({ success: true, data: { id, url } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.get('/:id/lyric', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!isValidTrackId(id)) {
      res.status(400).json({ error: 'Invalid song ID' });
      return;
    }
    const musicSource = createMusicSource();
    const lyric = await musicSource.getLyric(id);
    res.json({ success: true, data: lyric });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
