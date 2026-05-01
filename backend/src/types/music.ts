export interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  duration: number;
  url?: string;
  source: 'local' | 'netease';
}

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

export interface PlaylistTracks {
  playlist: Playlist;
  tracks: Track[];
}

export interface SearchResult {
  songs: Track[];
  total: number;
}

export interface Lyric {
  lyric: string;
  tlyric?: string;
}
