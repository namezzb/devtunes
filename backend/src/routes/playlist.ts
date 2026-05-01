import { Router, Request, Response } from 'express';
import { createMusicSource } from '../services/music-source-factory.js';
import { neteaseService } from '../services/netease.js';
import { resolveNeteaseUrl } from '../services/urlResolver.js';
import axios from 'axios';

const router = Router();

interface ResolveRequestBody {
  url: string;
}

router.post('/resolve', async (req: Request, res: Response) => {
  try {
    const { url } = req.body as ResolveRequestBody;

    if (!url || typeof url !== 'string') {
      res.status(400).json({ success: false, error: 'URL is required' });
      return;
    }

    const result = await resolveNeteaseUrl(url);

    if (result.type === 'unknown' || result.id === null) {
      res.status(400).json({ success: false, error: 'Unable to resolve URL' });
      return;
    }

    res.json({
      success: true,
      data: {
        type: result.type,
        id: result.id,
        resolvedUrl: result.resolvedUrl || result.originalUrl,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.get('/proxy', async (req: Request, res: Response) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      res.status(400).json({ success: false, error: 'URL is required' });
      return;
    }

    if (!url.includes('music.126.net')) {
      res.status(400).json({ success: false, error: 'Invalid audio URL' });
      return;
    }

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Referer': 'https://music.163.com/',
      'Accept-Encoding': 'identity',
    };

    const rangeHeader = req.headers['range'];
    if (rangeHeader) {
      headers['Range'] = rangeHeader;
    }

    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 0,
      headers,
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length');

    const contentType = (response.headers['content-type'] as string) || 'audio/mpeg';
    res.setHeader('Content-Type', contentType);

    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length'] as string | number);
    }

    if (response.headers['content-range']) {
      res.setHeader('Content-Range', response.headers['content-range']);
      res.status(206);
    }

    response.data.pipe(res);

    response.data.on('error', (err: Error) => {
      console.error('Stream error:', err.message);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Proxy error';
    console.error('Audio proxy error:', message);
    res.status(500).json({ success: false, error: message });
  }
});

function isValidPlaylistId(id: string): boolean {
  if (id === 'local-library') return true;
  return !isNaN(parseInt(id, 10));
}

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!isValidPlaylistId(id)) {
      res.status(400).json({ error: 'Invalid playlist ID' });
      return;
    }
    const musicSource = createMusicSource();
    const playlist = await musicSource.getPlaylist(id);
    res.json({ success: true, data: playlist });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.get('/:id/tracks', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!isValidPlaylistId(id)) {
      res.status(400).json({ error: 'Invalid playlist ID' });
      return;
    }
    const musicSource = createMusicSource();
    const result = await musicSource.getPlaylistTracks(id);
    res.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
