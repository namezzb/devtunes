import axios, { AxiosInstance } from 'axios';

const NETEASE_API_BASE = process.env.NETEASE_API_BASE || 'http://localhost:3000';

interface NeteasePlaylist {
  id: number;
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

interface NeteaseTrack {
  id: number;
  name: string;
  artists: Array<{ id: number; name: string }>;
  album: {
    name: string;
    picUrl: string;
  };
  duration: number;
}

interface NeteaseSongUrl {
  id: number;
  url: string;
  size: number;
  type: string;
}

interface NeteaseLyric {
  lyric: string;
  tlyric?: string;
}

interface NeteaseSearchResult {
  songs: NeteaseTrack[];
  total: number;
}

class NeteaseService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: NETEASE_API_BASE,
      timeout: 10000,
    });
  }

  /**
   * Get playlist details by ID
   */
  async getPlaylist(id: number): Promise<NeteasePlaylist> {
    const response = await this.client.get(`/playlist/detail?id=${id}`);
    const data = response.data;

    if (data.code !== 200) {
      throw new Error(`Netease API error: ${data.msg || 'Unknown error'}`);
    }

    return {
      id: data.playlist.id,
      name: data.playlist.name,
      coverImgUrl: data.playlist.coverImgUrl,
      description: data.playlist.description || '',
      trackCount: data.playlist.trackCount,
      playCount: data.playlist.playCount,
      creator: {
        nickname: data.playlist.creator.nickname,
        avatarUrl: data.playlist.creator.avatarUrl,
      },
    };
  }

  /**
   * Get all tracks in a playlist with playable URLs
   */
  async getPlaylistTracks(playlistId: number): Promise<{
    playlist: NeteasePlaylist;
    tracks: Array<NeteaseTrack & { url?: string }>;
  }> {
    // Get playlist details and tracks in parallel
    const [playlistResponse, tracksResponse] = await Promise.all([
      this.client.get(`/playlist/detail?id=${playlistId}`),
      this.client.get(`/playlist/track/all?id=${playlistId}`),
    ]);

    const playlistData = playlistResponse.data;
    const tracksData = tracksResponse.data;

    if (playlistData.code !== 200 || tracksData.code !== 200) {
      throw new Error('Failed to fetch playlist data');
    }

    const playlist: NeteasePlaylist = {
      id: playlistData.playlist.id,
      name: playlistData.playlist.name,
      coverImgUrl: playlistData.playlist.coverImgUrl,
      description: playlistData.playlist.description || '',
      trackCount: playlistData.playlist.trackCount,
      playCount: playlistData.playlist.playCount,
      creator: {
        nickname: playlistData.playlist.creator.nickname,
        avatarUrl: playlistData.playlist.creator.avatarUrl,
      },
    };

    // Get song URLs for all tracks
    const trackIds = tracksData.songs.map((s: NeteaseTrack) => s.id);
    let songUrls: Map<number, string> = new Map();

    if (trackIds.length > 0) {
      try {
        const urlResponse = await this.client.get(`/song/url?id=${trackIds.join(',')}`);
        if (urlResponse.data.code === 200) {
          urlResponse.data.data.forEach((song: NeteaseSongUrl) => {
            if (song.url) {
              songUrls.set(song.id, song.url);
            }
          });
        }
      } catch {
        console.warn('Could not fetch song URLs, continuing without them');
      }
    }

    const tracks = tracksData.songs.map((track: NeteaseTrack) => ({
      ...track,
      url: songUrls.get(track.id),
    }));

    return { playlist, tracks };
  }

  /**
   * Get song URL by ID
   */
  async getSongUrl(songId: number): Promise<string | null> {
    const response = await this.client.get(`/song/url?id=${songId}`);
    const data = response.data;

    if (data.code !== 200) {
      throw new Error('Failed to fetch song URL');
    }

    const song = data.data[0] as NeteaseSongUrl;
    return song?.url || null;
  }

  /**
   * Get lyric by song ID
   */
  async getLyric(songId: number): Promise<NeteaseLyric | null> {
    try {
      const response = await this.client.get(`/lyric?id=${songId}`);
      const data = response.data;

      if (data.code !== 200) {
        return null;
      }

      return {
        lyric: data.lrc?.lyric || '',
        tlyric: data.tlyric?.lyric,
      };
    } catch {
      return null;
    }
  }

  /**
   * Search songs by keyword
   */
  async search(keyword: string, limit: number = 20): Promise<NeteaseSearchResult> {
    const response = await this.client.get(
      `/search?keywords=${encodeURIComponent(keyword)}&limit=${limit}`
    );
    const data = response.data;

    if (data.code !== 200) {
      throw new Error('Search failed');
    }

    return {
      songs: data.result.songs || [],
      total: data.result.songCount || 0,
    };
  }
}

export const neteaseService = new NeteaseService();
export { NeteaseService, NeteasePlaylist, NeteaseTrack, NeteaseSongUrl, NeteaseLyric, NeteaseSearchResult };
