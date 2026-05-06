import { Router, Request, Response } from 'express';
import { createMusicSource } from '../services/music-source-factory.js';
import { MusicdlService } from '../services/musicdl-service.js';
import { isValidNeteaseUrl } from '../services/url-resolver.js';
import type { ParsedTrack } from '../types/musicdl.js';

const router = Router();
const musicdlService = new MusicdlService();

function isValidPlaylistId(id: string): boolean {
  if (id === 'local-library') return true;
  return !isNaN(parseInt(id, 10));
}

router.post('/import', async (req: Request, res: Response) => {
  try {
    const { url, targetDir } = req.body as { url?: string; targetDir?: string };

    if (!url || typeof url !== 'string' || !url.trim()) {
      res.status(400).json({ success: false, error: 'url is required' });
      return;
    }

    const trimmedUrl = url.trim();

    if (!isValidNeteaseUrl(trimmedUrl)) {
      res.status(400).json({
        success: false,
        error: 'Invalid playlist URL. Please provide a Netease Cloud Music playlist link (music.163.com or 163cn.tv).',
      });
      return;
    }

    const parsedTracks: ParsedTrack[] = await musicdlService.parsePlaylist(trimmedUrl);

    if (parsedTracks.length === 0) {
      res.status(200).json({
        success: true,
        data: {
          playlistId: `musicdl-${Date.now()}`,
          name: `Imported Playlist`,
          tracks: [],
        },
        warning: 'The playlist was parsed but no songs were found. The Netease API may be temporarily unavailable or the playlist may be empty.',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        playlistId: `musicdl-${Date.now()}`,
        name: `Imported Playlist`,
        tracks: parsedTracks.map((t) => ({
          id: t.id,
          title: t.songName,
          artist: t.singers,
          coverUrl: t.coverUrl,
          duration: t.durationS,
          url: t.downloadUrl,
          source: 'local' as const,
        })),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('ECONNREFUSED') || message.includes('connect') || message.includes('502')) {
      res.status(503).json({
        success: false,
        error: 'Music parsing service is unavailable. Please try again later or check that the musicdl-service is running on port 3002.',
      });
      return;
    }
    res.status(500).json({ success: false, error: message });
  }
});

router.get('/import-status', async (_req: Request, res: Response) => {
  try {
    const progress = await musicdlService.getDownloadStatus();
    res.json({ success: true, data: progress });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.post('/import/download', async (req: Request, res: Response) => {
  try {
    const { playlistUrl, targetDir, songIdentifiers } = req.body as {
      playlistUrl?: string;
      targetDir?: string;
      songIdentifiers?: string[];
    };

    if (!playlistUrl || typeof playlistUrl !== 'string' || !playlistUrl.trim()) {
      res.status(400).json({ success: false, error: 'playlistUrl is required' });
      return;
    }

    if (!targetDir || typeof targetDir !== 'string' || !targetDir.trim()) {
      res.status(400).json({ success: false, error: 'targetDir is required' });
      return;
    }

    const result = await musicdlService.downloadPlaylist(
      playlistUrl.trim(),
      targetDir.trim(),
      songIdentifiers,
    );

    res.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

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
