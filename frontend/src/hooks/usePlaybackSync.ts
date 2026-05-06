import { useEffect, useRef } from 'react';
import { updatePlayerState } from '../services/api';
import type { Track } from '../services/api';

interface PlaybackSyncState {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  volume: number;
  playlist: Track[];
  playMode: 'list' | 'shuffle' | 'repeat';
}

export function usePlaybackSync(state: PlaybackSyncState) {
  const lastSyncRef = useRef<number>(0);
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const now = Date.now();

    if (now - lastSyncRef.current < 3000) {
      if (pendingRef.current) {
        clearTimeout(pendingRef.current);
      }
      pendingRef.current = setTimeout(() => {
        syncState(state);
        lastSyncRef.current = Date.now();
      }, 3000);
      return;
    }

    syncState(state);
    lastSyncRef.current = now;

    return () => {
      if (pendingRef.current) {
        clearTimeout(pendingRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only sync on meaningful state changes, not on every progress tick
  }, [state.currentTrack?.id, state.isPlaying, state.playMode]);
}

async function syncState(state: PlaybackSyncState) {
  try {
    await updatePlayerState({
      currentTrack: state.currentTrack,
      isPlaying: state.isPlaying,
      progress: state.progress,
      volume: state.volume / 100,
      playlist: state.playlist,
      playMode: state.playMode,
    });
  } catch {
    void 0;
  }
}
