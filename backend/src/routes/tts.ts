import { Router, Request, Response, json } from 'express';
import axios from 'axios';

const router = Router();
router.use(json());

const FISH_AUDIO_API_KEY = process.env.FISH_AUDIO_API_KEY || '';
const FISH_AUDIO_API_URL = process.env.FISH_AUDIO_API_URL || 'https://api.fish.audio';

interface Voice {
  id: string;
  name: string;
  language: string;
}

const DEFAULT_VOICES: Voice[] = [
  { id: 'default', name: 'Default (English)', language: 'en' },
  { id: 'zh-CN', name: 'Chinese', language: 'zh' },
  { id: 'ja-JP', name: 'Japanese', language: 'ja' },
];

router.get('/voices', (_req: Request, res: Response) => {
  res.json({ success: true, data: DEFAULT_VOICES });
});

router.post('/', async (req: Request, res: Response) => {
  const { text, voice_id = 'default' }: { text: string; voice_id?: string } = req.body;

  if (!text || text.trim() === '') {
    res.status(400).json({ error: 'Text is required' });
    return;
  }

  if (!FISH_AUDIO_API_KEY) {
    res.status(503).json({
      success: false,
      error: 'Fish Audio API key not configured',
    });
    return;
  }

  try {
    const response = await axios.post(
      `${FISH_AUDIO_API_URL}/tts`,
      {
        text,
        voice: voice_id,
      },
      {
        headers: {
          'Authorization': `Bearer ${FISH_AUDIO_API_KEY}`,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    );

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="tts.mp3"');
    res.send(response.data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
