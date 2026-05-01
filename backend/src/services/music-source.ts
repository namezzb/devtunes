import { Track, Playlist, SearchResult, Lyric } from '../types/music.js';

export interface MusicSource {
  readonly name: string;

  getPlaylist(id: string): Promise<Playlist>;
  getPlaylistTracks(playlistId: string): Promise<{ playlist: Playlist; tracks: Track[] }>;
  searchSongs(query: string, limit?: number): Promise<SearchResult>;
  getTrackUrl(trackId: string): Promise<string | null>;
  getLyric(trackId: string): Promise<Lyric | null>;
}
