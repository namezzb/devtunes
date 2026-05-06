import { Router, Request, Response } from 'express';
import { query } from '@anthropic-ai/claude-agent-sdk';
import path from 'path';
import type { ChatRequestContext } from '../types/chat.js';
import { playerStateService } from '../services/player-state.js';

const router = Router();

const SUPPORTED_MODELS = ['claude-sonnet-4-6', 'claude-haiku-4-5'] as const;

const PROJECT_ROOT = path.resolve(process.cwd(), '..');

const AGENT_SYSTEM_PROMPT = `你是一个情感陪伴和工作伙伴 AI，集成在 DEVTunes（一款面向独立开发者的音乐 + AI 应用）中。

## 你的角色
你是用户的工作伙伴和情感陪伴者。你不是编程助手，你的核心价值在于通过分析用户当前的环境——时间、天气、正在听的音乐、可用的歌单——理解用户的情绪状态，并给予恰当的情感回应、工作陪伴和音乐推荐。

## 当前环境
{context}

## 能力
- Read：读取项目中的代码文件，了解用户的工作内容
- Grep：在代码库中搜索模式和关键词
- Glob：浏览项目结构，发现文件的组织方式

## 行为准则
- 始终用中文回复（用户采用中文交流）
- 温暖、有同理心、风趣幽默，像一个了解你工作状态且懂音乐的好朋友
- 根据当前时间、天气、正在播放的音乐，推断用户的情绪和工作状态
- 用户情绪低落或工作疲惫时，给予鼓励或建议切换音乐、休息
- 可以推荐歌单中适合当前情绪的音乐，说明推荐理由
- 对天气变化表达关心（如："外面下雨了，今天适合在室内安心 coding"）
- 使用 Markdown 格式化：代码块包裹代码、列表组织要点、加粗强调重点
- 回复简洁但充实，不要过于冗长`;

const EMPTY_CONTEXT_BLOCK = `- 时间：未知
- 天气：未知
- 正在播放：无
- 可播放列表：空`;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function composeSystemPrompt(frontendCtx?: ChatRequestContext): string {
  const playerState = playerStateService.getState();
  const currentTrack = playerState.currentTrack;
  const playlist = playerState.playlist;

  const timeLine = frontendCtx
    ? `- 时间：${frontendCtx.clock.dayOfWeek} ${frontendCtx.clock.hours}:${frontendCtx.clock.minutes}，${frontendCtx.clock.date}`
    : '- 时间：未知';

  const timeCategoryLine = frontendCtx
    ? `- 时段：${frontendCtx.timeCategory}`
    : '';

  const weatherLine = frontendCtx?.weather
    ? `- 天气：${frontendCtx.weather.condition}，${frontendCtx.weather.temperature}°C，体感 ${frontendCtx.weather.feelsLike}°C，湿度 ${frontendCtx.weather.humidity}%`
    : '- 天气：未知';

  const trackLine = currentTrack
    ? `- 正在播放：${currentTrack.title} — ${currentTrack.artist}（${formatDuration(currentTrack.duration)}）`
    : '- 正在播放：无';

  const playlistLines: string[] = [];
  if (playlist.length > 0) {
    const previewTracks = playlist.slice(0, 20);
    const trackList = previewTracks
      .map((t) => `${t.title} - ${t.artist}`)
      .join('、');
    playlistLines.push(`- 可播放列表（共 ${playlist.length} 首）：${trackList}`);
    if (playlist.length > 20) {
      playlistLines.push(`  ...还有 ${playlist.length - 20} 首`);
    }
  } else {
    playlistLines.push('- 可播放列表：空');
  }

  const contextBlock = [
    timeLine,
    timeCategoryLine,
    weatherLine,
    trackLine,
    ...playlistLines,
  ].filter(Boolean).join('\n');

  return AGENT_SYSTEM_PROMPT.replace('{context}', contextBlock);
}

router.post('/', async (req: Request, res: Response) => {
  const { message, sessionId, model, thinkingMode, context }:
    { message: string; sessionId?: string; model?: string; thinkingMode?: boolean; context?: ChatRequestContext } = req.body;

  if (!message || message.trim() === '') {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  if (model && !SUPPORTED_MODELS.includes(model as typeof SUPPORTED_MODELS[number])) {
    res.status(400).json({ error: 'Invalid model. Supported: claude-sonnet-4-6, claude-haiku-4-5' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const thinkingConfig: { type: 'adaptive' } | { type: 'disabled' } = thinkingMode
    ? { type: 'adaptive' }
    : { type: 'disabled' };
  const effortLevel: 'high' | 'low' = thinkingMode ? 'high' : 'low';

  try {
    for await (const msg of query({
      prompt: message,
      options: {
        includePartialMessages: true,
        cwd: PROJECT_ROOT,
        systemPrompt: composeSystemPrompt(context),
        allowedTools: ['Read', 'Grep', 'Glob'],
        permissionMode: 'bypassPermissions',
        maxTurns: 15,
        maxBudgetUsd: 1.0,
        settingSources: ['user'],
        thinking: thinkingConfig,
        effort: effortLevel,
        ...(model ? { model } : {}),
        ...(sessionId ? { resume: sessionId } : {}),
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

export default router;
