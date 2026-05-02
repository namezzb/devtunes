import { Router, Request, Response } from 'express';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { homedir } from 'os';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';

const router = Router();

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const AGENT_SYSTEM_PROMPT = `You are an intelligent AI assistant integrated into DEVTunes, a music + developer productivity web app.

## YOUR ROLE
You provide emotional support, music recommendations, coding help, and life advice.
You can read the user's project files to understand their work context.
You respond in the user's language (Chinese for Chinese input, English for English input).

## CAPABILITIES
- Read and analyze code files in the project
- Search for patterns across the codebase (Grep)
- Browse project structure (Glob)
- Provide programming advice and debugging help
- Recommend music based on user's mood and context

## BEHAVIOR
- Be warm, empathetic, and conversational — like a pair programming buddy who also DJs
- When the user seems stressed from coding, suggest a music break or specific genre
- Use markdown formatting: code blocks for code, lists for enumeration, bold for emphasis
- Keep responses concise but thorough`;

function loadClaudeSettings(): Record<string, string> {
  const settingsPath = join(homedir(), '.claude', 'settings.json');
  if (existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
      return settings.env || {};
    } catch {
      return {};
    }
  }
  return {};
}

router.post('/', async (req: Request, res: Response) => {
  const { message, history = [] }: { message: string; history?: ChatMessage[] } = req.body;
  const claudeSettings = loadClaudeSettings();

  if (!message || message.trim() === '') {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  Object.assign(process.env, {
    ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL || claudeSettings.ANTHROPIC_BASE_URL || 'https://api.minimaxi.com/anthropic',
    ANTHROPIC_AUTH_TOKEN: process.env.ANTHROPIC_AUTH_TOKEN || claudeSettings.ANTHROPIC_AUTH_TOKEN,
    NO_COLOR: '1',
  });

  const prompt = buildPrompt(message, history);

  try {
    for await (const msg of query({
      prompt,
      options: {
        includePartialMessages: true,
        cwd: join(homedir(), 'PycharmProjects', 'devtunes'),
        systemPrompt: AGENT_SYSTEM_PROMPT,
        allowedTools: ['Read', 'Grep', 'Glob'],
        permissionMode: 'bypassPermissions',
        maxTurns: 15,
        maxBudgetUsd: 1.0,
        settingSources: [],
      },
    })) {
      switch (msg.type) {
        case 'system':
          if (msg.subtype === 'init') {
            res.write(`data: ${JSON.stringify({ type: 'init', sessionId: msg.session_id, model: msg.model })}\n\n`);
          }
          break;

        case 'assistant':
          break;

        case 'stream_event': {
          const event = msg.event;
          if (!event || typeof event !== 'object') break;

          if (event.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
            res.write(`data: ${JSON.stringify({ type: 'tool_start', name: event.content_block.name })}\n\n`);
          } else if (event.type === 'content_block_delta') {
            const delta = event.delta;
            if (delta?.type === 'text_delta' && delta.text) {
              res.write(`data: ${JSON.stringify({ type: 'chunk', content: delta.text })}\n\n`);
            } else if (delta?.type === 'thinking_delta' && delta.thinking) {
              res.write(`data: ${JSON.stringify({ type: 'thinking', content: delta.thinking })}\n\n`);
            } else if (delta?.type === 'input_json_delta' && delta.partial_json) {
              res.write(`data: ${JSON.stringify({ type: 'tool_input', content: delta.partial_json })}\n\n`);
            }
          } else if (event.type === 'content_block_stop') {
            res.write(`data: ${JSON.stringify({ type: 'tool_end' })}\n\n`);
          }
          break;
        }

        case 'result':
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
