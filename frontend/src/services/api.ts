export interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  duration: number;
  url?: string;
  source?: 'local';
}

export interface PlaybackState {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  playlist: Track[];
  currentIndex: number;
  playMode: 'list' | 'shuffle' | 'repeat';
  timestamp: number;
}

export interface SearchResult {
  songs: Track[];
  total: number;
}

export interface ChatMessage {
  role: 'user' | 'agent';
  content: string;
}

export interface TtsVoice {
  id: string;
  name: string;
  language: string;
}

export interface ChatChunk {
  type: 'chunk' | 'done' | 'error' | 'init' | 'tool_start' | 'tool_end' | 'thinking';
  content?: string;
  error?: string;
  name?: string;
  sessionId?: string;
  model?: string;
}

interface BackendTrack {
  id: number;
  name: string;
  artists: Array<{ id: number; name: string }>;
  album: {
    name: string;
    picUrl: string;
  };
  duration: number;
}

// Transform backend types to frontend types
function transformTrack(raw: BackendTrack & { url?: string; source?: string }): Track {
  return {
    id: String(raw.id),
    title: raw.name,
    artist: raw.artists?.map(a => a.name).join(', ') || 'Unknown',
    coverUrl: raw.album?.picUrl || '',
    duration: Math.floor((raw.duration || 0) / 1000),
    url: raw.url,
    source: 'local' as const,
  };
}

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  return response.json();
}

export async function searchSongs(keyword: string): Promise<SearchResult> {
  const encoded = encodeURIComponent(keyword);
  const data = await apiFetch<{ success: boolean; data: { songs: BackendTrack[]; total: number } }>(`/api/search?q=${encoded}`);
  return {
    songs: data.data.songs.map(transformTrack),
    total: data.data.total,
  };
}

export interface ChatContext {
  weather: {
    temperature: number;
    condition: string;
    feelsLike: number;
    humidity: number;
    location: string;
  } | null;
  clock: {
    hours: string;
    minutes: string;
    dayOfWeek: string;
    date: string;
    period: 'AM' | 'PM';
  };
  timeCategory: string;
}

export function chat(
  message: string,
  sessionId: string | null,
  onChunk: (content: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
  onInit?: (sid: string) => void,
  onThinking?: (content: string) => void,
  onToolStart?: (name: string) => void,
  onToolEnd?: () => void,
  model?: string,
  thinkingMode?: boolean,
  context?: ChatContext,
): () => void {
  const controller = new AbortController();

  fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      ...(sessionId ? { sessionId } : {}),
      ...(model ? { model } : {}),
      thinkingMode: thinkingMode ?? true,
      ...(context ? { context } : {}),
    }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          while (buffer.includes('\n')) {
            const newlineIndex = buffer.indexOf('\n');
            const line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);

            if (line.startsWith('data: ')) {
              try {
                const chunk: ChatChunk = JSON.parse(line.slice(6));
            if (chunk.type === 'chunk' && chunk.content) {
              onChunk(chunk.content);
            } else if (chunk.type === 'thinking' && chunk.content && onThinking) {
              onThinking(chunk.content);
            } else if (chunk.type === 'init' && chunk.sessionId && onInit) {
                  onInit(chunk.sessionId);
                } else if (chunk.type === 'tool_start' && chunk.name && onToolStart) {
                  onToolStart(chunk.name);
                } else if (chunk.type === 'tool_end' && onToolEnd) {
                  onToolEnd();
                } else if (chunk.type === 'done') {
                  onDone();
                  return;
                } else if (chunk.type === 'error' && chunk.error) {
                  onError(chunk.error);
                  return;
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }

        if (buffer.startsWith('data: ')) {
          try {
            const chunk: ChatChunk = JSON.parse(buffer.slice(6));
            if (chunk.type === 'chunk' && chunk.content) {
              onChunk(chunk.content);
            } else if (chunk.type === 'tool_start' && chunk.name && onToolStart) {
              onToolStart(chunk.name);
            } else if (chunk.type === 'tool_end' && onToolEnd) {
              onToolEnd();
            } else if (chunk.type === 'done') {
              onDone();
              return;
            } else if (chunk.type === 'error' && chunk.error) {
              onError(chunk.error);
              return;
            }
          /* eslint-disable no-empty */ } catch { }
          /* eslint-enable no-empty */
        }
      } finally {
        reader.releaseLock();
      }
    })
    .catch((error) => {
      if (error.name !== 'AbortError') {
        onError(error.message);
      }
    });

  return () => controller.abort();
}

export async function getTtsVoices(): Promise<{ voices: TtsVoice[] }> {
  return apiFetch<{ voices: TtsVoice[] }>('/api/tts/voices');
}

export async function textToSpeech(text: string, voiceId: string): Promise<Blob> {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`TTS API error ${response.status}: ${errorText}`);
  }

  return response.blob();
}

export async function getPlayerState(): Promise<PlaybackState> {
  const data = await apiFetch<{ success: boolean; data: PlaybackState }>('/api/player/state');
  return data.data;
}

export async function updatePlayerState(partial: Partial<PlaybackState>): Promise<PlaybackState> {
  const data = await apiFetch<{ success: boolean; data: PlaybackState }>('/api/player/state', {
    method: 'PATCH',
    body: JSON.stringify(partial),
  });
  return data.data;
}

export async function playerAction(
  action: 'play' | 'pause' | 'next' | 'prev' | 'seek',
  payload?: { position?: number }
): Promise<PlaybackState> {
  const data = await apiFetch<{ success: boolean; data: PlaybackState }>('/api/player/action', {
    method: 'POST',
    body: JSON.stringify({ action, payload }),
  });
  return data.data;
}

export async function scanLibrary(): Promise<{ trackCount: number; tracks: Track[] }> {
  const data = await apiFetch<{ success: boolean; data: { trackCount: number; tracks: Track[] } }>('/api/library/scan', {
    method: 'POST',
  });
  return data.data;
}

export async function getLocalTracks(): Promise<Track[]> {
  const data = await apiFetch<{ success: boolean; data: Track[] }>('/api/library');
  return data.data;
}

export interface ImportPlaylistResult {
  playlistId: string;
  name: string;
  tracks: Track[];
}

export interface DownloadResult {
  total: number;
  downloaded: number;
  skipped: number;
  failed: number;
  errors: Array<{ song: string; error: string }>;
}

export interface ImportStatus {
  total: number;
  completed: number;
  currentSong: string;
  status: 'idle' | 'downloading' | 'completed' | 'failed';
}

export async function importMusicdlPlaylist(url: string): Promise<ImportPlaylistResult> {
  const data = await apiFetch<{ success: boolean; data: ImportPlaylistResult }>('/api/playlist/import', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
  return data.data;
}

export async function downloadMusicdlPlaylist(
  playlistUrl: string,
  targetDir: string,
  songIdentifiers?: string[]
): Promise<DownloadResult> {
  const data = await apiFetch<{ success: boolean; data: DownloadResult }>('/api/playlist/import/download', {
    method: 'POST',
    body: JSON.stringify({ playlistUrl, targetDir, songIdentifiers }),
  });
  return data.data;
}

export async function getImportStatus(): Promise<ImportStatus> {
  const data = await apiFetch<{ success: boolean; data: ImportStatus }>('/api/playlist/import-status');
  return data.data;
}

export interface LibraryConfig {
  musicLibraryPath: string;
}

export async function getLibraryConfig(): Promise<LibraryConfig> {
  const data = await apiFetch<{ success: boolean; data: LibraryConfig }>('/api/library/config');
  return data.data;
}
