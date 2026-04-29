import { describe, it, expect } from 'vitest';

describe('NeteaseService Logic', () => {
  describe('Playlist ID extraction', () => {
    const extractPlaylistId = (url: string): number | null => {
      const match = url.match(/id=(\d+)/);
      return match ? parseInt(match[1], 10) : null;
    };

    it('should extract playlist ID from standard URL', () => {
      const url = 'https://music.163.com/playlist?id=123456789';
      expect(extractPlaylistId(url)).toBe(123456789);
    });

    it('should extract playlist ID from mobile URL', () => {
      const url = 'https://y.music.163.com/m/playlist?id=987654321';
      expect(extractPlaylistId(url)).toBe(987654321);
    });

    it('should return null for URLs without ID', () => {
      expect(extractPlaylistId('https://music.163.com/')).toBeNull();
    });
  });

  describe('Playlist data transformation', () => {
    const transformPlaylist = (data: any) => ({
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
    });

    it('should transform playlist data correctly', () => {
      const apiResponse = {
        code: 200,
        playlist: {
          id: 12345,
          name: 'Test Playlist',
          coverImgUrl: 'https://example.com/cover.jpg',
          description: 'A test playlist',
          trackCount: 100,
          playCount: 1000,
          creator: {
            nickname: 'TestUser',
            avatarUrl: 'https://example.com/avatar.jpg',
          },
        },
      };

      const result = transformPlaylist(apiResponse);

      expect(result.id).toBe(12345);
      expect(result.name).toBe('Test Playlist');
      expect(result.coverImgUrl).toBe('https://example.com/cover.jpg');
      expect(result.trackCount).toBe(100);
      expect(result.playCount).toBe(1000);
      expect(result.creator.nickname).toBe('TestUser');
    });

    it('should handle missing description', () => {
      const apiResponse = {
        code: 200,
        playlist: {
          id: 12345,
          name: 'Test Playlist',
          coverImgUrl: 'https://example.com/cover.jpg',
          trackCount: 100,
          playCount: 1000,
          creator: {
            nickname: 'TestUser',
            avatarUrl: 'https://example.com/avatar.jpg',
          },
        },
      };

      const result = transformPlaylist(apiResponse);
      expect(result.description).toBe('');
    });
  });

  describe('Song URL extraction', () => {
    const extractSongUrl = (data: any): string | null => {
      if (data.code !== 200) return null;
      const song = data.data[0];
      return song?.url || null;
    };

    it('should extract song URL when available', () => {
      const apiResponse = {
        code: 200,
        data: [{
          id: 12345,
          url: 'https://music.163.com/song.mp3',
          size: 3000000,
          type: 'mp3',
        }],
      };

      expect(extractSongUrl(apiResponse)).toBe('https://music.163.com/song.mp3');
    });

    it('should return null when URL is null', () => {
      const apiResponse = {
        code: 200,
        data: [{
          id: 12345,
          url: null,
        }],
      };

      expect(extractSongUrl(apiResponse)).toBeNull();
    });

    it('should return null when API returns error', () => {
      const apiResponse = { code: 400, msg: 'error' };
      expect(extractSongUrl(apiResponse)).toBeNull();
    });
  });

  describe('Lyric parsing', () => {
    const parseLyric = (data: any) => {
      if (data.code !== 200) return null;
      return {
        lyric: data.lrc?.lyric || '',
        tlyric: data.tlyric?.lyric,
      };
    };

    it('should parse lyric with translation', () => {
      const apiResponse = {
        code: 200,
        lrc: { lyric: '[00:00.00]Test lyric' },
        tlyric: { lyric: '[00:00.00]Translation' },
      };

      const result = parseLyric(apiResponse);
      expect(result?.lyric).toBe('[00:00.00]Test lyric');
      expect(result?.tlyric).toBe('[00:00.00]Translation');
    });

    it('should handle missing lyric', () => {
      const apiResponse = { code: 200, lrc: {}, tlyric: {} };
      const result = parseLyric(apiResponse);
      expect(result?.lyric).toBe('');
    });

    it('should return null for API error', () => {
      const apiResponse = { code: 400 };
      expect(parseLyric(apiResponse)).toBeNull();
    });
  });

  describe('Search result parsing', () => {
    const parseSearchResult = (data: any) => ({
      songs: data.result?.songs || [],
      total: data.result?.songCount || 0,
    });

    it('should parse search results correctly', () => {
      const apiResponse = {
        code: 200,
        result: {
          songs: [{
            id: 123,
            name: 'Test Song',
            artists: [{ id: 1, name: 'Artist 1' }],
            album: { name: 'Album', picUrl: 'https://example.com/album.jpg' },
            duration: 180000,
          }],
          songCount: 1,
        },
      };

      const result = parseSearchResult(apiResponse);
      expect(result.songs.length).toBe(1);
      expect(result.total).toBe(1);
      expect(result.songs[0].name).toBe('Test Song');
    });

    it('should handle empty results', () => {
      const apiResponse = { code: 200, result: {} };
      const result = parseSearchResult(apiResponse);
      expect(result.songs).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
