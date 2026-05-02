export interface Playlist {
  id: string;
  name: string;
  coverImgUrl: string;
  description: string;
  trackCount: number;
  playCount: number;
  creator: {
    nickname: string;
    avatarUrl: string;
  };
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  duration: number;
  url?: string;
  source?: 'local' | 'netease';
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

export interface PlaylistTracks {
  playlist: Playlist;
  tracks: Track[];
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
  type: 'chunk' | 'done' | 'error' | 'tool_start' | 'tool_end' | 'thinking';
  content?: string;
  error?: string;
  name?: string;
}

// Backend response types (raw from API)
interface BackendPlaylist {
  id: number;
  name: string;
  coverImgUrl: string;
  description: string;
  trackCount: number;
  playCount: number;
  creator: {
    nickname: string;
    avatarUrl: string;
  };
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
function transformPlaylist(raw: BackendPlaylist): Playlist {
  return {
    id: String(raw.id),
    name: raw.name,
    coverImgUrl: raw.coverImgUrl,
    description: raw.description || '',
    trackCount: raw.trackCount,
    playCount: raw.playCount,
    creator: raw.creator,
  };
}

function transformTrack(raw: BackendTrack & { url?: string; source?: string }): Track {
  return {
    id: String(raw.id),
    title: raw.name,
    artist: raw.artists?.map(a => a.name).join(', ') || 'Unknown',
    coverUrl: raw.album?.picUrl || '',
    duration: Math.floor((raw.duration || 0) / 1000),
    url: raw.url,
    source: (raw.source as 'local' | 'netease') || 'netease',
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

export async function getPlaylist(id: string): Promise<Playlist> {
  const data = await apiFetch<{ success: boolean; data: BackendPlaylist }>(`/api/playlist/${id}`);
  return transformPlaylist(data.data);
}

export async function getPlaylistTracks(id: string): Promise<PlaylistTracks> {
  const data = await apiFetch<{ success: boolean; data: { playlist: BackendPlaylist; tracks: (BackendTrack & { url?: string })[] } }>(`/api/playlist/${id}/tracks`);
  return {
    playlist: transformPlaylist(data.data.playlist),
    tracks: data.data.tracks.map(transformTrack),
  };
}

export async function searchSongs(keyword: string): Promise<SearchResult> {
  const encoded = encodeURIComponent(keyword);
  const data = await apiFetch<{ success: boolean; data: { songs: BackendTrack[]; total: number } }>(`/api/search?q=${encoded}`);
  return {
    songs: data.data.songs.map(transformTrack),
    total: data.data.total,
  };
}

export function chat(
  message: string,
  history: ChatMessage[],
  onChunk: (content: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
  onToolStart?: (name: string) => void,
  onToolEnd?: () => void,
): () => void {
  const controller = new AbortController();

  fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
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
