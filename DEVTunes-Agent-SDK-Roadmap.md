# DEVTunes Agent SDK 扩展路线图

> 基于 `@anthropic-ai/claude-agent-sdk` v0.2.126 的能力规划
> 文档位置: `code.claude.com/docs/en/agent-sdk/`

---

## 当前状态：Phase 0 (已完成)

| 项目 | 状态 |
|------|------|
| MusicPlayer | ✅ howler.js + useReducer 重构完成 |
| AI Chat 基础 | ✅ `spawn(claude, ['-p'])` 可用 |
| 流式输出 | ❌ 裸 STDOUT，无 token 对齐 |
| Markdown 渲染 | ❌ 纯文本显示 |
| AI 感知音乐上下文 | ❌ buildPrompt 只有一句话 |

---

## Phase 1：核心迁移 (计划中)

**目标**: 从 `spawn(claude)` 迁移到 Agent SDK，获得 token 级流式 + markdown 渲染

**文件改动**:

| 文件 | 操作 |
|------|------|
| `backend/package.json` | + `@anthropic-ai/claude-agent-sdk` |
| `backend/src/routes/chat.ts` | 重写: `spawn` → `query({ includePartialMessages: true })` |
| `frontend/package.json` | + `react-markdown`, `react-syntax-highlighter` |
| `frontend/src/components/agent/ChatMessage.tsx` | `<ReactMarkdown>` 渲染 |
| `frontend/src/hooks/useChat.ts` | 适配 SDK 消息格式 |
| `frontend/src/services/api.ts` | ChatChunk 接口扩展 |

**核心代码**:

```typescript
// backend/src/routes/chat.ts
import { query } from '@anthropic-ai/claude-agent-sdk';

for await (const msg of query({
  prompt: buildPrompt(message, history),
  options: {
    includePartialMessages: true,
    systemPrompt: buildSystemPrompt(),
    permissionMode: 'bypassPermissions',
    maxTurns: 2,
    maxBudgetUsd: 0.5,
    settingSources: ['project'],
  }
})) {
  if (msg.type === 'stream_event') {
    // msg.event.delta.type === 'text_delta' → token 级文本
    // msg.event.delta.type === 'thinking_delta' → 思考过程
    // msg.event.delta.type === 'input_json_delta' → 工具调用参数
  }
}
```

---

## Phase 2：音乐上下文注入

**目标**: AI 知道用户在听什么，可以基于音乐上下文回答

**实现**: `systemPrompt` 注入 `playerStateService.getState()` 的播放状态

```typescript
function buildSystemPrompt(): string {
  const state = playerStateService.getState();
  return `
## CURRENT CONTEXT
The user is currently listening to:
  Track: ${state.currentTrack?.title || 'None'}
  Artist: ${state.currentTrack?.artist || 'None'}
  Playlist: ${state.playlist.length} tracks
  Play Mode: ${state.playMode}

## BEHAVIOR
- Respond in the user's language
- Use markdown for formatting`;
}
```

**效果**: 用户说 "推荐类似的歌" → AI 知道当前在听什么风格的歌

---

## Phase 3：自定义工具 (Custom Tools)

**SDK 能力**: `tool()` + `createSdkMcpServer()` → 给 Agent 定义可调用的 TypeScript 函数

**DEVTunes 场景**:

### 3.1 音乐搜索工具
```typescript
tool('search_music', '搜索网易云音乐', {
  keyword: z.string().describe('搜索关键词'),
}, async ({ keyword }) => {
  const result = await createMusicSource().searchSongs(keyword);
  return { content: [{ type: 'text', text: JSON.stringify(result.songs.slice(0, 10)) }] };
});
```

### 3.2 播放控制工具
```typescript
tool('get_current_track', '获取当前播放曲目', {}, async () => {
  const state = playerStateService.getState();
  return { content: [{ type: 'text', text: `${state.currentTrack?.title} - ${state.currentTrack?.artist}` }] };
});

tool('get_playlist', '获取歌单', {}, async () => {
  const tracks = playerStateService.getState().playlist.map((t, i) => `${i + 1}. ${t.title} - ${t.artist}`).join('\n');
  return { content: [{ type: 'text', text: tracks }] };
});
```

### 3.3 天气工具（未来 Widget）
```typescript
tool('get_weather', '获取天气', {
  location: z.string().describe('城市名'),
}, async ({ location }) => {
  const data = await fetch(`https://api.open-meteo.com/v1/forecast?...`);
  return { content: [{ type: 'text', text: `${location}: ${data.temp}°C, ${data.condition}` }] };
});
```

**集成方式**:
```typescript
const devtunesServer = createSdkMcpServer({
  name: 'devtunes',
  version: '1.0.0',
  tools: [searchMusic, getCurrentTrack, getPlaylist, getWeather],
});

query({
  prompt: "帮我找周杰伦的歌",
  options: {
    mcpServers: { devtunes: devtunesServer },
    allowedTools: ['mcp__devtunes__search_music', 'mcp__devtunes__get_current_track'],
  }
});
```

**文档**: [Agent SDK Custom Tools Guide](https://code.claude.com/docs/en/agent-sdk/guides/custom-tools)

---

## Phase 4：子 Agent 系统 (Sub-agents)

**SDK 能力**: `agents` 选项 → 定义专业化子 Agent，主 Agent 通过 `Task` 工具调度

**DEVTunes 场景**:

### 4.1 Code Reviewer
```typescript
agents: {
  'code-reviewer': {
    description: 'Expert code review for security, quality, patterns',
    prompt: 'You are a code review specialist. Identify vulnerabilities, suggest improvements.',
    tools: ['Read', 'Grep', 'Glob'],
    model: 'sonnet',
  },
}
```

### 4.2 音乐推荐官
```typescript
agents: {
  'music-recommender': {
    description: 'Analyzes music taste and suggests tracks',
    prompt: `Based on user's listening history and current mood, recommend music.
             Use the get_current_track and get_playlist tools to understand preferences.`,
    tools: ['mcp__devtunes__get_current_track', 'mcp__devtunes__get_playlist'],
  },
}
```

### 4.3 测试运行器
```typescript
agents: {
  'test-runner': {
    description: 'Executes and analyzes test suites',
    prompt: 'Run test commands and provide clear analysis of results.',
    tools: ['Bash', 'Read', 'Grep'],
  },
}
```

**文档**: [Agent SDK Subagents Guide](https://code.claude.com/docs/en/agent-sdk/guides/subagents)

---

## Phase 5：会话持久化 (Session Management)

**SDK 能力**: `resume: sessionId` → 恢复之前的对话上下文

**DEVTunes 场景**: 类似 ChatGPT 的对话历史

```typescript
// 第一轮：存储 sessionId
let sessionId: string;
for await (const msg of query({ prompt: "分析这个项目的架构" })) {
  if (msg.type === 'system' && msg.subtype === 'init') {
    sessionId = msg.session_id;
  }
}

// 第二轮：恢复上下文
for await (const msg of query({
  prompt: "能具体说说 MusicPlayer 的设计吗？",
  options: { resume: sessionId },
})) { }

// 分叉对话
for await (const msg of query({
  prompt: "换个思路，如果要用 Web Worker 实现呢？",
  options: { resume: sessionId, forkSession: true },
})) { }
```

**持久化方案**: 将 `sessionId` 存入 IndexedDB，支持多次访问之间的对话恢复

**文档**: [Agent SDK Session Management](https://code.claude.com/docs/en/agent-sdk/typescript#resume)

---

## Phase 6：结构化输出 (Structured Output)

**SDK 能力**: `outputFormat: { type: 'json_schema', schema }` → Agent 返回验证后的 JSON

**DEVTunes 场景**:

```typescript
// 音乐分析报告
query({
  prompt: "分析当前歌单的音乐风格",
  options: {
    outputFormat: {
      type: 'json_schema',
      schema: {
        type: 'object',
        properties: {
          dominantGenre: { type: 'string' },
          mood: { type: 'string' },
          tempo: { type: 'string' },
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                artist: { type: 'string' },
                reason: { type: 'string' },
              },
            },
          },
        },
        required: ['dominantGenre', 'recommendations'],
      },
    },
  }
});
// result.structured_output → Typed JSON
```

**文档**: [Agent SDK Structured Outputs](https://code.claude.com/docs/en/agent-sdk/structured-outputs)

---

## Phase 7：Hooks 监控系统

**SDK 能力**: `hooks` 选项 → 在 Agent 生命周期关键节点执行回调

**支持的 Hook 事件**:
| 事件 | 触发时机 | DEVTunes 用途 |
|------|---------|--------------|
| `PreToolUse` | 工具调用前 | 审计日志、阻止危险操作 |
| `PostToolUse` | 工具调用后 | 记录操作结果 |
| `SessionStart` | 会话开始 | 初始化监控 |
| `SessionEnd` | 会话结束 | 清理资源、统计 |
| `UserPromptSubmit` | 用户提交 prompt | 注入额外上下文 |
| `Stop` | Agent 停止 | 保存状态 |
| `PreCompact` | 上下文压缩前 | 优化 prompt |

```typescript
hooks: {
  PreToolUse: [{
    matcher: 'Bash',
    hooks: [async (input, toolUseId, ctx) => {
      logger.info(`Bash: ${input.tool_input.command}`);
      return { decision: 'allow' };
    }],
  }],
}
```

**文档**: [Agent SDK Hooks](https://code.claude.com/docs/en/agent-sdk/hooks)

---

## Phase 8：多 Widget 上下文注入

**目标**: AI 感知所有左侧 Widget 的状态（音乐 + 天气 + Todo...）

**架构**:
```
SharedContext (AppContext 扩展)
├── musicWidget.state   → currentTrack, playlist, history
├── weatherWidget.state → location, temp, condition
├── todoWidget.state    → pending tasks
└── ...any new widget

PromptAssembler (新模块)
├── 读取所有 Widget 状态
├── 拼接成结构化 System Prompt
└── 注入 query() 的 systemPrompt 选项
```

**示例 Prompt**:
```
## CURRENT CONTEXT
Music: "Deep Space" by Stellar | Playlist: Cyberpunk Coding (42 tracks)
Weather: Clear, 28°C at Beijing
Tasks: ☐ Submit PR, ☐ Write docs, ☑ Fix bug
```

---

## 各 Phase 依赖关系

```
Phase 1 (核心迁移) ─── 前置依赖，必须第一个完成
     │
     ├── Phase 2 (音乐上下文) ─── 立即可做，不改架构
     │
     ├── Phase 3 (自定义工具) ─── 依赖 Phase 1
     │
     ├── Phase 4 (子 Agent) ─── 依赖 Phase 1
     │
     ├── Phase 5 (会话持久化) ─── 依赖 Phase 1 + 前端 IndexedDB
     │
     ├── Phase 6 (结构化输出) ─── 独立于其他，可随时做
     │
     ├── Phase 7 (Hooks) ─── 独立于其他，可随时做
     │
     └── Phase 8 (多 Widget 上下文) ─── 需要在 AppContext 中实现 Widget 注册系统
```

---

## 技术参考

| 资源 | URL |
|------|-----|
| Agent SDK 概览 | https://code.claude.com/docs/en/agent-sdk/overview |
| TypeScript SDK API | https://code.claude.com/docs/en/agent-sdk/typescript |
| Streaming 输出 | https://code.claude.com/docs/en/agent-sdk/streaming-output |
| 自定义工具指南 | https://code.claude.com/docs/en/agent-sdk/guides/custom-tools |
| 子 Agent 指南 | https://code.claude.com/docs/en/agent-sdk/guides/subagents |
| Hooks 指南 | https://code.claude.com/docs/en/agent-sdk/hooks |
| 结构化输出 | https://code.claude.com/docs/en/agent-sdk/structured-outputs |
| 迁移指南 | https://code.claude.com/docs/en/agent-sdk/migration-guide |
| npm 包 | https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk |
| GitHub | https://github.com/anthropics/claude-agent-sdk-typescript |
| Context7 文档 | https://context7.com/nothflare/claude-agent-sdk-docs |
