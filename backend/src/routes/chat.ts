import { Router, Request, Response } from 'express';
import { query } from '@anthropic-ai/claude-agent-sdk';

const router = Router();

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
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
  res.flushHeaders();

  const prompt = buildPrompt(message, history);

  try {
    for await (const msg of query({
      prompt,
      options: {
        includePartialMessages: true,
        permissionMode: 'bypassPermissions',
        maxTurns: 2,
        maxBudgetUsd: 0.5,
        settingSources: ['project'],
      },
    })) {
      if (msg.type === 'system' && msg.subtype === 'init') {
        res.write(`data: ${JSON.stringify({ type: 'init', sessionId: msg.session_id, model: msg.model })}\n\n`);
        continue;
      }

      if (msg.type === 'stream_event') {
        const event = msg.event as { type?: string; delta?: { type?: string; text?: string; thinking?: string } };

        if (event.type === 'content_block_delta' && event.delta) {
          if (event.delta.type === 'text_delta' && event.delta.text) {
            res.write(`data: ${JSON.stringify({ type: 'chunk', content: event.delta.text })}\n\n`);
          } else if (event.delta.type === 'thinking_delta' && event.delta.thinking) {
            res.write(`data: ${JSON.stringify({ type: 'thinking', content: event.delta.thinking })}\n\n`);
          }
        }
        continue;
      }

      if (msg.type === 'result') {
        if (msg.subtype === 'success') {
          res.write(`data: ${JSON.stringify({
            type: 'done',
            sessionId: msg.session_id,
            cost: msg.total_cost_usd,
            turns: msg.num_turns,
          })}\n\n`);
        } else {
          res.write(`data: ${JSON.stringify({
            type: 'error',
            error: msg.subtype,
            errors: 'errors' in msg ? msg.errors : [],
          })}\n\n`);
        }
        res.end();
        return;
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.write(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`);
    res.end();
  }
});

function buildPrompt(message: string, history: ChatMessage[]): string {
  let prompt = '';

  for (const msg of history) {
    prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
  }

  prompt += `User: ${message}\n`;
  prompt += 'Assistant: ';

  return prompt;
}

export default router;
