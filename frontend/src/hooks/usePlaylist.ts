import { useState, useCallback } from 'react';
import type { Track, ImportPlaylistResult } from '../services/api';
import {
  importMusicdlPlaylist as apiImportPlaylist,
  getImportStatus as apiGetImportStatus,
  type ImportStatus,
} from '../services/api';

interface PlaylistState {
  tracks: Track[];
  loading: boolean;
  error: string | null;
  importResult: ImportPlaylistResult | null;
  downloadStatus: ImportStatus | null;
}

export function usePlaylist() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportPlaylistResult | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<ImportStatus | null>(null);

  const importMusicdlPlaylist = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    setImportResult(null);
    try {
      const result = await apiImportPlaylist(url);
      setImportResult(result);
      setTracks(result.tracks);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkDownloadStatus = useCallback(async () => {
    try {
      const status = await apiGetImportStatus();
      setDownloadStatus(status);
      return status;
    } catch (err) {
      // Silently fail for polling
      return null;
    }
  }, []);

  return {
    tracks,
    loading,
    error,
    importResult,
    downloadStatus,
    importMusicdlPlaylist,
    checkDownloadStatus,
    setTracks,
  };
}
