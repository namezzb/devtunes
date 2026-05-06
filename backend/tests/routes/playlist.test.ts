import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Server } from 'http';
import type { ParsedTrack, DownloadResult, DownloadProgress } from '../../src/types/musicdl.js';

const mockParsePlaylist = vi.fn<(url: string) => Promise<ParsedTrack[]>>();
const mockDownloadPlaylist = vi.fn<
  (playlistUrl: string, targetDir: string, songIdentifiers?: string[]) => Promise<DownloadResult>
>();
const mockGetDownloadStatus = vi.fn<() => Promise<DownloadProgress>>();

vi.mock('../../src/services/musicdl-service.js', () => ({
  MusicdlService: vi.fn().mockImplementation(() => ({
    parsePlaylist: mockParsePlaylist,
    downloadPlaylist: mockDownloadPlaylist,
    getDownloadStatus: mockGetDownloadStatus,
  })),
}));

const mockGetPlaylist = vi.fn<(id: string) => Promise<unknown>>();
const mockGetPlaylistTracks = vi.fn<(playlistId: string) => Promise<unknown>>();

vi.mock('../../src/services/music-source-factory.js', () => ({
  createMusicSource: vi.fn().mockReturnValue({
    getPlaylist: mockGetPlaylist,
    getPlaylistTracks: mockGetPlaylistTracks,
  }),
}));

const SAMPLE_PARSED_TRACK: ParsedTrack = {
  id: '1',
  songName: 'Test Song',
  singers: 'Test Artist',
  album: 'Test Album',
  durationS: 180,
  coverUrl: 'https://example.com/cover.jpg',
  identifier: '1',
  ext: 'mp3',
  downloadUrl: 'https://example.com/audio.mp3',
};

const SAMPLE_DOWNLOAD_RESULT: DownloadResult = {
  total: 5,
  downloaded: 3,
  skipped: 1,
  failed: 1,
  errors: [{ song: 'Bad Song', error: 'Timeout' }],
};

const SAMPLE_DOWNLOAD_PROGRESS: DownloadProgress = {
  total: 10,
  completed: 5,
  currentSong: 'Current Song',
  status: 'downloading',
};

describe('Playlist Routes', () => {
  let server: Server;
  let baseUrl: string;

  beforeEach(async () => {
    vi.clearAllMocks();

    const { createApp } = await import('../../src/app.js');
    const app = createApp();
    const http = await import('http');
    server = http.createServer(app);

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as { port: number }).port;
    baseUrl = `http://localhost:${port}`;
  });

  afterEach(() => {
    server.close();
  });

  describe('POST /api/playlist/import', () => {
    it('returns parsed playlist on success', async () => {
      mockParsePlaylist.mockResolvedValue([SAMPLE_PARSED_TRACK]);

      const response = await fetch(`${baseUrl}/api/playlist/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://music.163.com/playlist?id=123' }),
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.tracks).toBeInstanceOf(Array);
      expect(body.data.tracks).toHaveLength(1);
      expect(body.data.tracks[0].title).toBe('Test Song');
      expect(body.data.tracks[0].artist).toBe('Test Artist');
      expect(body.data.tracks[0].source).toBe('local');
    });

    it('returns 400 when url is missing', async () => {
      const response = await fetch(`${baseUrl}/api/playlist/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('url');
    });

    it('returns 400 when url is empty string', async () => {
      const response = await fetch(`${baseUrl}/api/playlist/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: '   ' }),
      });

      expect(response.status).toBe(400);
    });

    it('returns 500 when parsePlaylist throws', async () => {
      mockParsePlaylist.mockRejectedValue(new Error('Service unavailable'));

      const response = await fetch(`${baseUrl}/api/playlist/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://music.163.com/playlist?id=123' }),
      });

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Service unavailable');
    });

    it('returns 400 for non-Netease URL', async () => {
      const response = await fetch(`${baseUrl}/api/playlist/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://spotify.com/playlist/abc' }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Invalid playlist URL');
    });

    it('returns 503 when musicdl service connection refused', async () => {
      mockParsePlaylist.mockRejectedValue(new Error('ECONNREFUSED'));

      const response = await fetch(`${baseUrl}/api/playlist/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://music.163.com/playlist?id=123' }),
      });

      expect(response.status).toBe(503);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Music parsing service');
    });

    it('returns 200 with warning when parse returns empty results', async () => {
      mockParsePlaylist.mockResolvedValue([]);

      const response = await fetch(`${baseUrl}/api/playlist/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://music.163.com/playlist?id=123' }),
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.tracks).toEqual([]);
      expect(body.warning).toBeDefined();
    });
  });

  describe('GET /api/playlist/import-status', () => {
    it('returns download progress', async () => {
      mockGetDownloadStatus.mockResolvedValue(SAMPLE_DOWNLOAD_PROGRESS);

      const response = await fetch(`${baseUrl}/api/playlist/import-status`);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.total).toBe(10);
      expect(body.data.completed).toBe(5);
      expect(body.data.currentSong).toBe('Current Song');
      expect(body.data.status).toBe('downloading');
    });

    it('returns 500 when getDownloadStatus throws', async () => {
      mockGetDownloadStatus.mockRejectedValue(new Error('Connection refused'));

      const response = await fetch(`${baseUrl}/api/playlist/import-status`);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Connection refused');
    });
  });

  describe('POST /api/playlist/import/download', () => {
    it('starts download and returns result', async () => {
      mockDownloadPlaylist.mockResolvedValue(SAMPLE_DOWNLOAD_RESULT);

      const response = await fetch(`${baseUrl}/api/playlist/import/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlistUrl: 'https://music.163.com/playlist?id=123',
          targetDir: '/tmp/music',
        }),
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.total).toBe(5);
      expect(body.data.downloaded).toBe(3);
    });

    it('passes songIdentifiers when provided', async () => {
      mockDownloadPlaylist.mockResolvedValue({
        total: 1,
        downloaded: 1,
        skipped: 0,
        failed: 0,
        errors: [],
      });

      await fetch(`${baseUrl}/api/playlist/import/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlistUrl: 'https://music.163.com/playlist?id=123',
          targetDir: '/tmp/music',
          songIdentifiers: ['id1', 'id2'],
        }),
      });

      expect(mockDownloadPlaylist).toHaveBeenCalledWith(
        'https://music.163.com/playlist?id=123',
        '/tmp/music',
        ['id1', 'id2'],
      );
    });

    it('returns 400 when playlistUrl is missing', async () => {
      const response = await fetch(`${baseUrl}/api/playlist/import/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetDir: '/tmp/music' }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('playlistUrl');
    });

    it('returns 400 when targetDir is missing', async () => {
      const response = await fetch(`${baseUrl}/api/playlist/import/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistUrl: 'https://music.163.com/playlist?id=123' }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('targetDir');
    });

    it('returns 500 when downloadPlaylist throws', async () => {
      mockDownloadPlaylist.mockRejectedValue(new Error('Download timeout'));

      const response = await fetch(`${baseUrl}/api/playlist/import/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlistUrl: 'https://music.163.com/playlist?id=123',
          targetDir: '/tmp/music',
        }),
      });

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Download timeout');
    });
  });

  describe('GET /api/playlist/:id', () => {
    it('returns playlist for valid id', async () => {
      mockGetPlaylist.mockResolvedValue({
        id: '123',
        name: 'Test Playlist',
        trackCount: 10,
      });

      const response = await fetch(`${baseUrl}/api/playlist/123`);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('123');
    });

    it('returns playlist for local-library id', async () => {
      mockGetPlaylist.mockResolvedValue({
        id: 'local-library',
        name: 'Local Library',
        trackCount: 5,
      });

      const response = await fetch(`${baseUrl}/api/playlist/local-library`);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it('returns 400 for invalid playlist id', async () => {
      const response = await fetch(`${baseUrl}/api/playlist/invalid`);

      expect(response.status).toBe(400);
    });

    it('returns 500 when getPlaylist throws', async () => {
      mockGetPlaylist.mockRejectedValue(new Error('Unknown playlist'));

      const response = await fetch(`${baseUrl}/api/playlist/999`);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.success).toBe(false);
    });
  });

  describe('GET /api/playlist/:id/tracks', () => {
    it('returns tracks for valid id', async () => {
      mockGetPlaylistTracks.mockResolvedValue({
        playlist: { id: '123', name: 'Test Playlist' },
        tracks: [{ id: 't1', title: 'Song 1' }],
      });

      const response = await fetch(`${baseUrl}/api/playlist/123/tracks`);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.tracks).toBeInstanceOf(Array);
    });

    it('returns 400 for invalid playlist id', async () => {
      const response = await fetch(`${baseUrl}/api/playlist/invalid/tracks`);

      expect(response.status).toBe(400);
    });

    it('returns 500 when getPlaylistTracks throws', async () => {
      mockGetPlaylistTracks.mockRejectedValue(new Error('Scan failed'));

      const response = await fetch(`${baseUrl}/api/playlist/123/tracks`);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.success).toBe(false);
    });
  });
});
