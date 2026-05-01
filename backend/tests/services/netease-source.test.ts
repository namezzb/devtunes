import { describe, it, expect, vi, beforeEach } from 'vitest';
import { neteaseSource } from '../../src/services/netease-source.js';
import { neteaseService } from '../../src/services/netease.js';
import type { Track, Playlist, SearchResult, Lyric } from '../../src/types/music.js';

vi.mock('../../src/services/netease.js', () => ({
  neteaseService: {
    getPlaylist: vi.fn(),
    getPlaylistTracks: vi.fn(),
    search: vi.fn(),
    getSongUrl: vi.fn(),
    getLyric: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('NeteaseSource adapter', () => {
  describe('name', () => {
    it('should have name "netease"', () => {
      expect(neteaseSource.name).toBe('netease');
    });
  });

  describe('getPlaylist', () => {
    const mockNeteasePlaylist = {
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
    };

    it('should convert Netease playlist to unified Playlist with string id', async () => {
      vi.mocked(neteaseService.getPlaylist).mockResolvedValue(mockNeteasePlaylist);

      const result: Playlist = await neteaseSource.getPlaylist('12345');

      expect(neteaseService.getPlaylist).toHaveBeenCalledWith(12345);
      expect(result).toEqual({
        id: '12345',
        name: 'Test Playlist',
        coverImgUrl: 'https://example.com/cover.jpg',
        description: 'A test playlist',
        trackCount: 100,
        playCount: 1000,
        creator: {
          nickname: 'TestUser',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
      });
    });

    it('should handle empty description', async () => {
      vi.mocked(neteaseService.getPlaylist).mockResolvedValue({
        ...mockNeteasePlaylist,
        description: '',
      });

      const result: Playlist = await neteaseSource.getPlaylist('12345');
      expect(result.description).toBe('');
    });

    it('should return empty Playlist on service error', async () => {
      vi.mocked(neteaseService.getPlaylist).mockRejectedValue(new Error('API error'));

      const result: Playlist = await neteaseSource.getPlaylist('12345');

      expect(result).toEqual({
        id: '',
        name: '',
        coverImgUrl: '',
        description: '',
        trackCount: 0,
        playCount: 0,
        creator: { nickname: '', avatarUrl: '' },
      });
    });

    it('should return empty Playlist on network error', async () => {
      vi.mocked(neteaseService.getPlaylist).mockRejectedValue(new Error('Network error'));

      const result: Playlist = await neteaseSource.getPlaylist('99999');

      expect(result.id).toBe('');
      expect(result.trackCount).toBe(0);
    });
  });

  describe('getPlaylistTracks', () => {
    const mockNeteasePlaylist = {
      id: 12345,
      name: 'Test Playlist',
      coverImgUrl: 'https://example.com/cover.jpg',
      description: 'Playlist with tracks',
      trackCount: 2,
      playCount: 500,
      creator: {
        nickname: 'Artist',
        avatarUrl: 'https://example.com/avatar.jpg',
      },
    };

    const mockTransformedTracks = [
      {
        id: 1,
        name: 'Song One',
        artists: [
          { id: 10, name: 'Artist A' },
          { id: 11, name: 'Artist B' },
        ],
        album: { name: 'Album X', picUrl: 'https://example.com/album1.jpg' },
        duration: 200000,
        url: '/api/playlist/proxy?url=https%3A%2F%2Fexample.com%2Fsong1.mp3',
      },
      {
        id: 2,
        name: 'Song Two',
        artists: [{ id: 12, name: 'Artist C' }],
        album: { name: 'Album Y', picUrl: 'https://example.com/album2.jpg' },
        duration: 180000,
      },
    ];

    it('should convert playlist and tracks to unified types', async () => {
      vi.mocked(neteaseService.getPlaylistTracks).mockResolvedValue({
        playlist: mockNeteasePlaylist,
        tracks: mockTransformedTracks,
      });

      const result = await neteaseSource.getPlaylistTracks('12345');

      expect(neteaseService.getPlaylistTracks).toHaveBeenCalledWith(12345);

      expect(result.playlist).toEqual({
        id: '12345',
        name: 'Test Playlist',
        coverImgUrl: 'https://example.com/cover.jpg',
        description: 'Playlist with tracks',
        trackCount: 2,
        playCount: 500,
        creator: { nickname: 'Artist', avatarUrl: 'https://example.com/avatar.jpg' },
      });

      expect(result.tracks[0]).toEqual({
        id: '1',
        title: 'Song One',
        artist: 'Artist A, Artist B',
        coverUrl: 'https://example.com/album1.jpg',
        duration: 200,
        url: '/api/playlist/proxy?url=https%3A%2F%2Fexample.com%2Fsong1.mp3',
        source: 'netease',
      });

      expect(result.tracks[1]).toEqual({
        id: '2',
        title: 'Song Two',
        artist: 'Artist C',
        coverUrl: 'https://example.com/album2.jpg',
        duration: 180,
        source: 'netease',
      });
    });

    it('should handle track with empty artists', async () => {
      vi.mocked(neteaseService.getPlaylistTracks).mockResolvedValue({
        playlist: mockNeteasePlaylist,
        tracks: [
          {
            ...mockTransformedTracks[0],
            artists: [],
            album: { name: '', picUrl: '' },
            duration: 0,
          },
        ],
      });

      const result = await neteaseSource.getPlaylistTracks('12345');

      expect(result.tracks[0].artist).toBe('');
      expect(result.tracks[0].coverUrl).toBe('');
      expect(result.tracks[0].duration).toBe(0);
    });

    it('should return empty result on error', async () => {
      vi.mocked(neteaseService.getPlaylistTracks).mockRejectedValue(
        new Error('API error'),
      );

      const result = await neteaseSource.getPlaylistTracks('12345');

      expect(result.playlist.id).toBe('');
      expect(result.tracks).toEqual([]);
    });
  });

  describe('searchSongs', () => {
    const mockNeteaseTracks = [
      {
        id: 100,
        name: 'Search Result 1',
        ar: [
          { id: 20, name: 'Artist X' },
          { id: 21, name: 'Artist Y' },
        ],
        al: { id: 30, name: 'Album Z', picUrl: 'https://example.com/search1.jpg' },
        dt: 240000,
      },
      {
        id: 101,
        name: 'Search Result 2',
        ar: [{ id: 22, name: 'Artist Z' }],
        al: { id: 31, name: 'Album W', picUrl: 'https://example.com/search2.jpg' },
        dt: 195000,
      },
    ];

    it('should convert search results to unified Tracks', async () => {
      vi.mocked(neteaseService.search).mockResolvedValue({
        songs: mockNeteaseTracks,
        total: 2,
      });

      const result: SearchResult = await neteaseSource.searchSongs('test query');

      expect(neteaseService.search).toHaveBeenCalledWith('test query', undefined);

      expect(result.total).toBe(2);
      expect(result.songs).toHaveLength(2);
      expect(result.songs[0]).toEqual({
        id: '100',
        title: 'Search Result 1',
        artist: 'Artist X, Artist Y',
        coverUrl: 'https://example.com/search1.jpg',
        duration: 240,
        source: 'netease',
      });
      expect(result.songs[1]).toEqual({
        id: '101',
        title: 'Search Result 2',
        artist: 'Artist Z',
        coverUrl: 'https://example.com/search2.jpg',
        duration: 195,
        source: 'netease',
      });
    });

    it('should pass limit parameter to service', async () => {
      vi.mocked(neteaseService.search).mockResolvedValue({
        songs: mockNeteaseTracks,
        total: 2,
      });

      await neteaseSource.searchSongs('query', 5);

      expect(neteaseService.search).toHaveBeenCalledWith('query', 5);
    });

    it('should handle empty search results', async () => {
      vi.mocked(neteaseService.search).mockResolvedValue({ songs: [], total: 0 });

      const result: SearchResult = await neteaseSource.searchSongs('empty');

      expect(result.songs).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle track with undefined al', async () => {
      vi.mocked(neteaseService.search).mockResolvedValue({
        songs: [
          {
            id: 200,
            name: 'No Album',
            ar: [{ id: 1, name: 'Solo' }],
            al: undefined,
            dt: 150000,
          },
        ],
        total: 1,
      });

      const result: SearchResult = await neteaseSource.searchSongs('query');
      expect(result.songs[0].coverUrl).toBe('');
      expect(result.songs[0].duration).toBe(150);
    });

    it('should return empty SearchResult on error', async () => {
      vi.mocked(neteaseService.search).mockRejectedValue(new Error('Search failed'));

      const result: SearchResult = await neteaseSource.searchSongs('fail');

      expect(result.songs).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getTrackUrl', () => {
    it('should return URL string when available', async () => {
      vi.mocked(neteaseService.getSongUrl).mockResolvedValue(
        'https://example.com/song.mp3',
      );

      const result: string | null = await neteaseSource.getTrackUrl('42');

      expect(neteaseService.getSongUrl).toHaveBeenCalledWith(42);
      expect(result).toBe('https://example.com/song.mp3');
    });

    it('should return null when no URL', async () => {
      vi.mocked(neteaseService.getSongUrl).mockResolvedValue(null);

      const result: string | null = await neteaseSource.getTrackUrl('42');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      vi.mocked(neteaseService.getSongUrl).mockRejectedValue(new Error('API error'));

      const result: string | null = await neteaseSource.getTrackUrl('42');

      expect(result).toBeNull();
    });
  });

  describe('getLyric', () => {
    it('should return lyric without translation', async () => {
      vi.mocked(neteaseService.getLyric).mockResolvedValue({
        lyric: '[00:00.00]Test lyric',
      });

      const result: Lyric | null = await neteaseSource.getLyric('42');

      expect(neteaseService.getLyric).toHaveBeenCalledWith(42);
      expect(result).toEqual({ lyric: '[00:00.00]Test lyric' });
    });

    it('should return lyric with translation', async () => {
      vi.mocked(neteaseService.getLyric).mockResolvedValue({
        lyric: '[00:00.00]Test lyric',
        tlyric: '[00:00.00]Translation',
      });

      const result: Lyric | null = await neteaseSource.getLyric('42');

      expect(result).toEqual({
        lyric: '[00:00.00]Test lyric',
        tlyric: '[00:00.00]Translation',
      });
    });

    it('should return null when no lyric', async () => {
      vi.mocked(neteaseService.getLyric).mockResolvedValue(null);

      const result: Lyric | null = await neteaseSource.getLyric('42');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      vi.mocked(neteaseService.getLyric).mockRejectedValue(new Error('API error'));

      const result: Lyric | null = await neteaseSource.getLyric('42');

      expect(result).toBeNull();
    });
  });
});
