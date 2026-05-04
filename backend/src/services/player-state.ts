import { EventEmitter } from 'events';
import { PlaybackState } from '../types/player.js';
import { Track } from '../types/music.js';

export class PlayerStateService extends EventEmitter {
  private state: PlaybackState;

  constructor() {
    super();
    this.state = {
      currentTrack: null,
      isPlaying: false,
      progress: 0,
      duration: 0,
      volume: 0.8,
      playlist: [],
      currentIndex: -1,
      playMode: 'list',
      timestamp: Date.now(),
    };
  }

  getState(): Readonly<PlaybackState> {
    return { ...this.state };
  }

  setState(partial: Partial<PlaybackState>): void {
    this.state = { ...this.state, ...partial, timestamp: Date.now() };
    this.emit('stateChanged', this.getState());
  }

  setCurrentTrack(track: Track | null): void {
    this.setState({ currentTrack: track, progress: 0 });
  }

  setPlaying(playing: boolean): void {
    this.setState({ isPlaying: playing });
  }

  setProgress(progress: number): void {
    this.setState({ progress });
  }

  setVolume(volume: number): void {
    this.setState({ volume });
  }

  setPlaylist(playlist: Track[], currentIndex: number = -1): void {
    this.setState({ playlist, currentIndex });
  }

  setPlayMode(mode: PlaybackState['playMode']): void {
    this.setState({ playMode: mode });
  }

  nextTrack(): Track | null {
    const { playlist, currentIndex, playMode } = this.state;
    if (playlist.length === 0) return null;

    let nextIndex: number;
    if (playMode === 'shuffle') {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = (currentIndex + 1) % playlist.length;
    }

    const nextTrack = playlist[nextIndex];
    this.setState({ currentTrack: nextTrack, currentIndex: nextIndex, progress: 0 });
    return nextTrack;
  }

  prevTrack(): Track | null {
    const { playlist, currentIndex } = this.state;
    if (playlist.length === 0) return null;

    const prevIndex = currentIndex <= 0 ? playlist.length - 1 : currentIndex - 1;
    const prevTrack = playlist[prevIndex];
    this.setState({ currentTrack: prevTrack, currentIndex: prevIndex, progress: 0 });
    return prevTrack;
  }
}

export const playerStateService = new PlayerStateService();
