import { Router, Request, Response } from 'express';
import { playerStateService } from '../services/player-state.js';
import { PlaybackState } from '../types/player.js';

const router = Router();

const PLAYBACK_STATE_KEYS: (keyof PlaybackState)[] = [
  'currentTrack',
  'isPlaying',
  'progress',
  'duration',
  'volume',
  'playlist',
  'currentIndex',
  'playMode',
  'timestamp',
];

type PlayerAction = 'play' | 'pause' | 'next' | 'prev' | 'seek';

const VALID_ACTIONS: PlayerAction[] = ['play', 'pause', 'next', 'prev', 'seek'];

router.get('/state', (_req: Request, res: Response) => {
  try {
    const state = playerStateService.getState();
    res.json({ success: true, data: state });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.patch('/state', (req: Request, res: Response) => {
  try {
    const body = req.body;

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      res.status(400).json({ success: false, error: 'Request body must be a JSON object' });
      return;
    }

    const unknownFields = Object.keys(body).filter(
      (key) => !PLAYBACK_STATE_KEYS.includes(key as keyof PlaybackState),
    );

    if (unknownFields.length > 0) {
      res.status(400).json({
        success: false,
        error: `Unknown fields: ${unknownFields.join(', ')}`,
      });
      return;
    }

    playerStateService.setState(body as Partial<PlaybackState>);
    const state = playerStateService.getState();
    res.json({ success: true, data: state });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.post('/action', (req: Request, res: Response) => {
  try {
    const { action, payload } = req.body as { action: string; payload?: unknown };

    if (!action || typeof action !== 'string') {
      res.status(400).json({ success: false, error: 'Action is required' });
      return;
    }

    if (!VALID_ACTIONS.includes(action as PlayerAction)) {
      res.status(400).json({ success: false, error: `Invalid action: ${action}` });
      return;
    }

    switch (action as PlayerAction) {
      case 'play':
        playerStateService.setPlaying(true);
        break;
      case 'pause':
        playerStateService.setPlaying(false);
        break;
      case 'next':
        playerStateService.nextTrack();
        break;
      case 'prev':
        playerStateService.prevTrack();
        break;
      case 'seek': {
        const position = (payload as { position?: number })?.position;
        if (typeof position !== 'number' || position < 0) {
          res.status(400).json({ success: false, error: 'Seek requires a valid position (seconds)' });
          return;
        }
        playerStateService.setProgress(position);
        break;
      }
    }

    const state = playerStateService.getState();
    res.json({ success: true, data: state });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
