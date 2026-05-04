import { Track } from './music.js';

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
