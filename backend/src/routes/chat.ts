import { Router, Request, Response, json } from 'express';
import { spawn } from 'child_process';
import { homedir } from 'os';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';

const router = Router();
router.use(json());

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function loadClaudeSettings() {
  const settingsPath = join(homedir(), '.claude', 'settings.json');
  console.log('Loading settings from:', settingsPath);
  console.log('Exists:', existsSync(settingsPath));
  if (existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
      console.log('Settings env:', settings.env);
      return settings.env || {};
    } catch (e) {
      console.log('Error parsing settings:', e);
      return {};
    }
  }
  return {};
}

router.post('/', async (req: Request, res: Response) => {
  const { message, history = [] }: { message: string; history?: ChatMessage[] } = req.body;

  if (!message || message.trim() === '') {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  const claudePath = process.env.CLAUDE_CODE_PATH || '/Users/zhangzibo/.local/bin/claude';
  const prompt = buildPrompt(message, history);
  const claudeSettings = loadClaudeSettings();

  const claudeEnv = {
    ...process.env,
    NO_COLOR: '1',
    PATH: process.env.PATH + ':/Users/zhangzibo/.local/bin',
    ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL || claudeSettings.ANTHROPIC_BASE_URL || 'https://api.minimaxi.com/anthropic',
    ANTHROPIC_AUTH_TOKEN: process.env.ANTHROPIC_AUTH_TOKEN || claudeSettings.ANTHROPIC_AUTH_TOKEN,
  };

  console.log('claudeEnv ANTHROPIC_AUTH_TOKEN:', claudeEnv.ANTHROPIC_AUTH_TOKEN ? 'set' : 'not set');

  const claude = spawn(claudePath, ['-p', '--output-format', 'stream-json', prompt], {
    env: claudeEnv,
  });

  claude.stdout.on('data', (data: Buffer) => {
    const text = data.toString();
    try {
      const parsed = JSON.parse(text);
      if (parsed.type === 'content' && parsed.content) {
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: parsed.content })}\n\n`);
      }
    } catch {
      res.write(`data: ${JSON.stringify({ type: 'chunk', content: text })}\n\n`);
    }
  });

  claude.stderr.on('data', (data: Buffer) => {
    console.error('Claude stderr:', data.toString());
  });

  claude.on('close', (code) => {
    clearInterval(heartbeat);
    if (code !== 0) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: `Claude exited with code ${code}` })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  });

  claude.on('error', (err: Error) => {
    clearInterval(heartbeat);
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
    res.end();
  });
});

function buildPrompt(message: string, history: ChatMessage[]): string {
  let prompt = 'You are a helpful AI assistant for developers.\n\n';

  for (const msg of history) {
    prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
  }

  prompt += `User: ${message}\n`;
  prompt += 'Assistant: ';

  return prompt;
}

export default router;
