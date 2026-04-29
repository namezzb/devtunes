import { useState, useCallback } from 'react';
import { getPlaylist, getPlaylistTracks, Playlist, Track } from '../services/api';

interface PlaylistState {
  playlist: Playlist | null;
  tracks: Track[];
  loading: boolean;
  error: string | null;
}

interface UsePlaylistReturn extends PlaylistState {
  loadPlaylist: (id: string) => Promise<void>;
  importPlaylist: (url: string) => Promise<void>;
  extractPlaylistId: (url: string) => string | null;
}

export function usePlaylist(): UsePlaylistReturn {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPlaylist = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const [playlistData, tracksData] = await Promise.all([
        getPlaylist(id),
        getPlaylistTracks(id),
      ]);

      setPlaylist(playlistData);
      setTracks(tracksData.tracks);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load playlist';
      setError(message);
      setPlaylist(null);
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const extractPlaylistId = useCallback((url: string): string | null => {
    const patterns = [
      /[?&]id=(\d+)/,
      /\/playlist\/(\d+)/,
      /\/m\/playlist\?id=(\d+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    if (/^\d+$/.test(url)) return url;
    return null;
  }, []);

  const importPlaylist = useCallback(async (url: string) => {
    const id = extractPlaylistId(url);
    if (!id) {
      setError('Invalid playlist URL');
      return;
    }
    await loadPlaylist(id);
  }, [extractPlaylistId, loadPlaylist]);

  return {
    playlist,
    tracks,
    loading,
    error,
    loadPlaylist,
    importPlaylist,
    extractPlaylistId,
  };
}
