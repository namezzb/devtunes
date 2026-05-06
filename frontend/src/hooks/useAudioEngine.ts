import { useReducer, useRef, useCallback, useEffect } from 'react';
import { Howl } from 'howler';
import type { Track } from '../services/api';

type AudioStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

interface AudioEngineState {
  status: AudioStatus;
  currentTrack: Track | null;
  position: number;
  duration: number;
  volume: number;
  muted: boolean;
  storedVolume: number;
  errorMessage: string | null;
}

type AudioEngineAction =
  | { type: 'LOAD_TRACK'; track: Track }
  | { type: 'LOADED'; duration: number }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'ENDED' }
  | { type: 'TICK'; position: number }
  | { type: 'SEEK'; position: number }
  | { type: 'SET_VOLUME'; volume: number }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'RESET' };

const initialState: AudioEngineState = {
  status: 'idle',
  currentTrack: null,
  position: 0,
  duration: 0,
  volume: 80,
  muted: false,
  storedVolume: 80,
  errorMessage: null,
};

function audioReducer(state: AudioEngineState, action: AudioEngineAction): AudioEngineState {
  switch (action.type) {
    case 'LOAD_TRACK':
      return {
        ...state,
        status: 'loading',
        currentTrack: action.track,
        position: 0,
        duration: 0,
        errorMessage: null,
      };
    case 'LOADED':
      return {
        ...state,
        status: state.status === 'loading' ? 'paused' : state.status,
        duration: action.duration,
      };
    case 'LOAD_ERROR':
      return {
        ...state,
        status: 'error',
        errorMessage: action.error,
      };
    case 'PLAY':
      return { ...state, status: 'playing' };
    case 'PAUSE':
      return { ...state, status: 'paused' };
    case 'ENDED':
      return { ...state, status: 'idle', position: 0 };
    case 'TICK':
      return { ...state, position: action.position };
    case 'SEEK':
      return { ...state, position: action.position };
    case 'SET_VOLUME':
      return {
        ...state,
        volume: action.volume,
        muted: action.volume === 0,
        storedVolume: action.volume > 0 ? action.volume : state.storedVolume,
      };
    case 'TOGGLE_MUTE':
      if (state.muted) {
        return {
          ...state,
          muted: false,
          volume: state.storedVolume,
        };
      }
      return {
        ...state,
        muted: true,
        storedVolume: state.volume,
        volume: 0,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface UseAudioEngineReturn {
  state: AudioEngineState;
  loadTrack: (track: Track, autoPlay?: boolean) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  nextTrack: (tracks: Track[], currentId: string, mode: 'loop' | 'random') => Track | null;
  prevTrack: (tracks: Track[], currentId: string) => Track | null;
  audioNode: HTMLAudioElement | null;
}

export function useAudioEngine(): UseAudioEngineReturn {
  const [state, dispatch] = useReducer(audioReducer, initialState);
  const howlRef = useRef<Howl | null>(null);
  const rafRef = useRef<number>(0);
  const loadIdRef = useRef(0);
  const audioNodeRef = useRef<HTMLAudioElement | null>(null);
  const [, forceRender] = useReducer((x) => x + 1, 0);

  const startProgressLoop = useCallback(() => {
    const tick = () => {
      if (howlRef.current) {
        const pos = howlRef.current.seek() as number;
        if (howlRef.current.state() === 'loaded') {
          dispatch({ type: 'TICK', position: pos });
        }
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopProgressLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  const extractAudioNode = useCallback(() => {
    const howl = howlRef.current;
    if (!howl) return;
    const node = (howl as unknown as { _sounds?: Array<{ _node?: unknown }> })._sounds?.[0]?._node;
    if (node instanceof HTMLAudioElement) {
      audioNodeRef.current = node;
      forceRender();
    }
  }, []);

  const loadTrack = useCallback(
    (track: Track, autoPlay = true) => {
      stopProgressLoop();

      if (howlRef.current) {
        howlRef.current.off();
        howlRef.current.unload();
        howlRef.current = null;
      }

      if (!track.url) {
        dispatch({ type: 'LOAD_ERROR', error: 'Track has no URL' });
        return;
      }
      const trackUrl = track.url;

      loadIdRef.current += 1;
      const thisLoadId = loadIdRef.current;

      dispatch({ type: 'LOAD_TRACK', track });

      const howl = new Howl({
        src: [trackUrl],
        html5: false,
        format: ['wav', 'mp3', 'flac'],
        preload: true,
        volume: state.volume / 100,
        onload: () => {
          if (loadIdRef.current !== thisLoadId) return;
          extractAudioNode();
          const duration = howl.duration();
          dispatch({ type: 'LOADED', duration });
        },
        onloaderror: (_id: number, errorCode: unknown) => {
          if (loadIdRef.current !== thisLoadId) return;
          const errorMsg = `Audio load error: ${track.title} (${trackUrl}), code=${errorCode}, html5=${!trackUrl.startsWith('blob:')}`;
          console.error(errorMsg);
          dispatch({ type: 'LOAD_ERROR', error: errorMsg });
        },
        onplay: (_id: number) => {
          if (loadIdRef.current !== thisLoadId) return;
          dispatch({ type: 'PLAY' });
          startProgressLoop();
        },
        onpause: (_id: number) => {
          if (loadIdRef.current !== thisLoadId) return;
          dispatch({ type: 'PAUSE' });
          stopProgressLoop();
        },
        onend: (_id: number) => {
          if (loadIdRef.current !== thisLoadId) return;
          dispatch({ type: 'ENDED' });
          stopProgressLoop();
        },
        onplayerror: (_id: number, _error: unknown) => {
          if (loadIdRef.current !== thisLoadId) return;
          console.error(`Audio play error: ${track.title} (${trackUrl})`);
          dispatch({ type: 'LOAD_ERROR', error: `Playback failed for ${track.title}` });
        },
      });

      howlRef.current = howl;
      extractAudioNode();

      if (autoPlay) {
        howl.play();
      }
    },
    [state.volume, extractAudioNode, startProgressLoop, stopProgressLoop],
  );

  const play = useCallback(() => {
    howlRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    howlRef.current?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    const howl = howlRef.current;
    if (!howl) return;
    if (howl.playing()) {
      howl.pause();
    } else {
      howl.play();
    }
  }, []);

  const seek = useCallback(
    (seconds: number) => {
      const howl = howlRef.current;
      if (!howl) return;
      howl.seek(seconds);
      dispatch({ type: 'SEEK', position: howl.seek() as number });
    },
    [],
  );

  const setVolume = useCallback(
    (vol: number) => {
      const clamped = Math.max(0, Math.min(100, vol));
      const howl = howlRef.current;
      if (howl) {
        howl.volume(clamped / 100);
        if (clamped > 0 && howl.mute()) {
          howl.mute(false);
        }
      }
      dispatch({ type: 'SET_VOLUME', volume: clamped });
    },
    [],
  );

  const toggleMute = useCallback(() => {
    const howl = howlRef.current;
    if (!howl) return;
    const wasMuted = state.muted;
    if (wasMuted) {
      howl.mute(false);
    } else {
      howl.mute(true);
    }
    dispatch({ type: 'TOGGLE_MUTE' });
  }, [state.muted]);

  const nextTrack = useCallback(
    (tracks: Track[], currentId: string, mode: 'loop' | 'random'): Track | null => {
      if (tracks.length === 0) return null;
      let nextIndex: number;
      if (mode === 'random') {
        nextIndex = Math.floor(Math.random() * tracks.length);
      } else {
        const currentIndex = tracks.findIndex((t) => t.id === currentId);
        nextIndex = (currentIndex + 1) % tracks.length;
      }
      return tracks[nextIndex] || tracks[0];
    },
    [],
  );

  const prevTrack = useCallback(
    (tracks: Track[], currentId: string): Track | null => {
      if (tracks.length === 0) return null;
      const currentIndex = tracks.findIndex((t) => t.id === currentId);
      const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
      return tracks[prevIndex] || tracks[0];
    },
    [],
  );

  useEffect(() => {
    return () => {
      stopProgressLoop();
      if (howlRef.current) {
        howlRef.current.off();
        howlRef.current.unload();
        howlRef.current = null;
      }
    };
  }, [stopProgressLoop]);

  return {
    state,
    loadTrack,
    play,
    pause,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    nextTrack,
    prevTrack,
    audioNode: audioNodeRef.current,
  };
}

export type { AudioEngineState, UseAudioEngineReturn };
