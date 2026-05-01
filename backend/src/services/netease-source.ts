import { neteaseService } from './netease.js';
import type { MusicSource } from './music-source.js';
import type { Track, Playlist, SearchResult, Lyric } from '../types/music.js';

function formatArtistName(artists: Array<{ name: string }> | undefined): string {
  return (artists || []).map((a) => a.name).join(', ');
}

function fromSearchTrack(track: {
  id: number;
  name: string;
  ar?: Array<{ name: string }>;
  al?: { picUrl?: string };
  dt?: number;
}): Track {
  return {
    id: String(track.id),
    title: track.name,
    artist: formatArtistName(track.ar),
    coverUrl: track.al?.picUrl || '',
    duration: (track.dt || 0) / 1000,
    source: 'netease',
  };
}

function fromPlaylistTrack(track: {
  id: number;
  name: string;
  artists?: Array<{ name: string }>;
  album?: { picUrl?: string };
  duration?: number;
  url?: string;
}): Track {
  return {
    id: String(track.id),
    title: track.name,
    artist: formatArtistName(track.artists),
    coverUrl: track.album?.picUrl || '',
    duration: (track.duration || 0) / 1000,
    url: track.url,
    source: 'netease',
  };
}

function fromNeteasePlaylist(playlist: {
  id: number;
  name: string;
  coverImgUrl: string;
  description: string;
  trackCount: number;
  playCount: number;
  creator: { nickname: string; avatarUrl: string };
}): Playlist {
  return {
    id: String(playlist.id),
    name: playlist.name,
    coverImgUrl: playlist.coverImgUrl,
    description: playlist.description,
    trackCount: playlist.trackCount,
    playCount: playlist.playCount,
    creator: { ...playlist.creator },
  };
}

const EMPTY_PLAYLIST: Playlist = {
  id: '',
  name: '',
  coverImgUrl: '',
  description: '',
  trackCount: 0,
  playCount: 0,
  creator: { nickname: '', avatarUrl: '' },
};

export const neteaseSource: MusicSource = {
  name: 'netease',

  async getPlaylist(id: string): Promise<Playlist> {
    try {
      const playlist = await neteaseService.getPlaylist(Number(id));
      return fromNeteasePlaylist(playlist);
    } catch {
      return { ...EMPTY_PLAYLIST };
    }
  },

  async getPlaylistTracks(
    playlistId: string,
  ): Promise<{ playlist: Playlist; tracks: Track[] }> {
    try {
      const result = await neteaseService.getPlaylistTracks(Number(playlistId));
      return {
        playlist: fromNeteasePlaylist(result.playlist),
        tracks: result.tracks.map(fromPlaylistTrack),
      };
    } catch {
      return { playlist: { ...EMPTY_PLAYLIST }, tracks: [] };
    }
  },

  async searchSongs(query: string, limit?: number): Promise<SearchResult> {
    try {
      const result = await neteaseService.search(query, limit);
      return {
        songs: result.songs.map(fromSearchTrack),
        total: result.total,
      };
    } catch {
      return { songs: [], total: 0 };
    }
  },

  async getTrackUrl(trackId: string): Promise<string | null> {
    try {
      return await neteaseService.getSongUrl(Number(trackId));
    } catch {
      return null;
    }
  },

  async getLyric(trackId: string): Promise<Lyric | null> {
    try {
      return await neteaseService.getLyric(Number(trackId));
    } catch {
      return null;
    }
  },
};
