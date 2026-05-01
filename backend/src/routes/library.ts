import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { LocalFileSource } from '../services/local-file-source.js';

const router = Router();

function getLocalFileSource(): LocalFileSource {
  const musicDir = process.env.MUSIC_LIBRARY_PATH
    ? path.resolve(process.env.MUSIC_LIBRARY_PATH.replace(/^~/, process.env.HOME || '~'))
    : path.join(process.env.HOME || '/', 'Music');
  return new LocalFileSource(musicDir);
}

router.get('/', async (_req: Request, res: Response) => {
  try {
    const source = getLocalFileSource();
    const tracks = await source.getPlaylistTracks('local-library');
    res.json({ success: true, data: tracks.tracks });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.post('/scan', async (_req: Request, res: Response) => {
  try {
    const source = getLocalFileSource();
    const result = await source.getPlaylistTracks('local-library');
    res.json({
      success: true,
      data: {
        trackCount: result.tracks.length,
        tracks: result.tracks,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.get('/audio/:id', async (req: Request, res: Response) => {
  try {
    const trackId = req.params.id;
    const source = getLocalFileSource();

    const tracks = await source.getPlaylistTracks('local-library');
    const track = tracks.tracks.find((t) => t.id === trackId);

    if (!track) {
      res.status(404).json({ success: false, error: 'Track not found' });
      return;
    }

    const filePath = source.getLibraryPath();
    const audioFiles = await findAudioFile(filePath, trackId, source);

    if (!audioFiles) {
      res.status(404).json({ success: false, error: 'Audio file not found' });
      return;
    }

    const stat = await fs.promises.stat(audioFiles);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize || start > end) {
        res.status(416).json({ success: false, error: 'Range not satisfiable' });
        return;
      }

      const chunkSize = end - start + 1;
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', String(chunkSize));
      res.setHeader('Content-Type', getContentType(audioFiles));

      const stream = fs.createReadStream(audioFiles, { start, end });
      stream.pipe(res);
    } else {
      res.setHeader('Content-Length', String(fileSize));
      res.setHeader('Content-Type', getContentType(audioFiles));
      res.setHeader('Accept-Ranges', 'bytes');

      const stream = fs.createReadStream(audioFiles);
      stream.pipe(res);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

async function findAudioFile(
  dir: string,
  trackId: string,
  source: LocalFileSource
): Promise<string | null> {
  const { generateTrackId } = await import('../services/local-file-source.js');

  const walk = async (currentDir: string): Promise<string | null> => {
    const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        const found = await walk(fullPath);
        if (found) return found;
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (['.mp3', '.flac', '.wav', '.ogg', '.m4a'].includes(ext)) {
          const id = generateTrackId(fullPath);
          if (id === trackId) {
            return fullPath;
          }
        }
      }
    }
    return null;
  };

  return walk(dir);
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const types: Record<string, string> = {
    '.mp3': 'audio/mpeg',
    '.flac': 'audio/flac',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
  };
  return types[ext] || 'application/octet-stream';
}

export default router;
