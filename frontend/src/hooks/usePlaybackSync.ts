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

    if (now - lastSyncRef.current < 500) {
      if (pendingRef.current) {
        clearTimeout(pendingRef.current);
      }
      pendingRef.current = setTimeout(() => {
        syncState(state);
        lastSyncRef.current = Date.now();
      }, 500);
      return;
    }

    syncState(state);
    lastSyncRef.current = now;

    return () => {
      if (pendingRef.current) {
        clearTimeout(pendingRef.current);
      }
    };
  }, [state.currentTrack?.id, state.isPlaying, state.playMode, state]);

  useEffect(() => {
    const interval = setInterval(() => {
      syncState(state);
    }, 2000);

    return () => clearInterval(interval);
  }, [state]);
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
