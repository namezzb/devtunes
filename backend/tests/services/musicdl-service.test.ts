import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { MusicdlService } from '../../src/services/musicdl-service.js';

vi.mock('axios');

describe('MusicdlService', () => {
  let service: MusicdlService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MusicdlService('http://localhost:3002');
  });

  describe('ping', () => {
    it('returns true when service is up', async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: { status: 'ok' } });
      const result = await service.ping();
      expect(result).toBe(true);
    });

    it('returns false when service is down', async () => {
      vi.mocked(axios.get).mockRejectedValue(new Error('Connection refused'));
      const result = await service.ping();
      expect(result).toBe(false);
    });

    it('returns false when response status is not ok', async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: { status: 'error' } });
      const result = await service.ping();
      expect(result).toBe(false);
    });
  });

  describe('parsePlaylist', () => {
    it('maps snake_case to camelCase correctly', async () => {
      vi.mocked(axios.post).mockResolvedValue({
        data: {
          success: true,
          data: [{
            song_name: 'Test Song',
            singers: 'Test Artist',
            album: 'Test Album',
            duration_s: 180,
            cover_url: 'https://example.com/cover.jpg',
            identifier: '12345',
            ext: 'flac',
            download_url: 'https://example.com/audio.flac',
          }],
        },
      });
      const result = await service.parsePlaylist('https://music.163.com/playlist?id=123');
      expect(result).toHaveLength(1);
      expect(result[0].songName).toBe('Test Song');
      expect(result[0].singers).toBe('Test Artist');
      expect(result[0].durationS).toBe(180);
      expect(result[0].coverUrl).toBe('https://example.com/cover.jpg');
      expect(result[0].id).toBe('12345');
      expect(result[0].ext).toBe('flac');
      expect(result[0].downloadUrl).toBe('https://example.com/audio.flac');
    });

    it('returns empty array when API returns empty data', async () => {
      vi.mocked(axios.post).mockResolvedValue({
        data: { success: true, data: [] },
      });
      const result = await service.parsePlaylist('https://music.163.com/playlist?id=empty');
      expect(result).toEqual([]);
    });

    it('throws when API returns success: false', async () => {
      vi.mocked(axios.post).mockResolvedValue({
        data: { success: false, error: 'Invalid URL' },
      });
      await expect(service.parsePlaylist('bad-url')).rejects.toThrow('Invalid URL');
    });

    it('throws default message when API returns success: false without error', async () => {
      vi.mocked(axios.post).mockResolvedValue({
        data: { success: false },
      });
      await expect(service.parsePlaylist('bad-url')).rejects.toThrow('Parse failed');
    });

    it('retries on first failure then succeeds', async () => {
      vi.mocked(axios.post)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: { success: true, data: [] },
        });
      const result = await service.parsePlaylist('https://music.163.com/playlist?id=123');
      expect(result).toEqual([]);
      expect(vi.mocked(axios.post)).toHaveBeenCalledTimes(2);
    });

    it('throws after max retries exhausted', async () => {
      vi.mocked(axios.post).mockRejectedValue(new Error('Network error'));
      await expect(service.parsePlaylist('url')).rejects.toThrow('Network error');
      expect(vi.mocked(axios.post)).toHaveBeenCalledTimes(3);
    });
  });

  describe('downloadPlaylist', () => {
    it('returns DownloadResult on success', async () => {
      vi.mocked(axios.post).mockResolvedValue({
        data: {
          success: true,
          data: {
            total: 5,
            downloaded: 3,
            skipped: 1,
            failed: 1,
            errors: [{ song: 'Bad Song', error: 'Timeout' }],
          },
        },
      });
      const result = await service.downloadPlaylist('url', '/tmp/music');
      expect(result.total).toBe(5);
      expect(result.downloaded).toBe(3);
      expect(result.skipped).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].song).toBe('Bad Song');
    });

    it('sends song_identifiers when provided', async () => {
      vi.mocked(axios.post).mockResolvedValue({
        data: {
          success: true,
          data: { total: 1, downloaded: 1, skipped: 0, failed: 0, errors: [] },
        },
      });
      await service.downloadPlaylist('url', '/tmp', ['id1', 'id2']);
      expect(vi.mocked(axios.post)).toHaveBeenCalledWith(
        'http://localhost:3002/download',
        { playlist_url: 'url', target_dir: '/tmp', song_identifiers: ['id1', 'id2'] },
        { timeout: 300000 }
      );
    });

    it('omits song_identifiers when not provided', async () => {
      vi.mocked(axios.post).mockResolvedValue({
        data: {
          success: true,
          data: { total: 1, downloaded: 1, skipped: 0, failed: 0, errors: [] },
        },
      });
      await service.downloadPlaylist('url', '/tmp');
      const callArgs = vi.mocked(axios.post).mock.calls[0][1] as Record<string, unknown>;
      expect(callArgs).not.toHaveProperty('song_identifiers');
    });

    it('throws when API returns success: false', async () => {
      vi.mocked(axios.post).mockResolvedValue({
        data: { success: false, error: 'Download error' },
      });
      await expect(service.downloadPlaylist('url', '/tmp')).rejects.toThrow('Download error');
    });

    it('retries on failure then succeeds', async () => {
      vi.mocked(axios.post)
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({
          data: { success: true, data: { total: 1, downloaded: 1, skipped: 0, failed: 0, errors: [] } },
        });
      const result = await service.downloadPlaylist('url', '/tmp');
      expect(result.downloaded).toBe(1);
      expect(vi.mocked(axios.post)).toHaveBeenCalledTimes(2);
    });

    it('throws after max retries exhausted', async () => {
      vi.mocked(axios.post).mockRejectedValue(new Error('Timeout'));
      await expect(service.downloadPlaylist('url', '/tmp')).rejects.toThrow('Timeout');
      expect(vi.mocked(axios.post)).toHaveBeenCalledTimes(3);
    });
  });

  describe('getDownloadStatus', () => {
    it('maps snake_case to camelCase', async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: { total: 10, completed: 5, current_song: 'Song Name', status: 'downloading' },
      });
      const result = await service.getDownloadStatus();
      expect(result.total).toBe(10);
      expect(result.completed).toBe(5);
      expect(result.currentSong).toBe('Song Name');
      expect(result.status).toBe('downloading');
    });

    it('returns idle status', async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: { total: 0, completed: 0, current_song: '', status: 'idle' },
      });
      const result = await service.getDownloadStatus();
      expect(result.status).toBe('idle');
      expect(result.total).toBe(0);
      expect(result.currentSong).toBe('');
    });

    it('returns completed status', async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: { total: 5, completed: 5, current_song: '', status: 'completed' },
      });
      const result = await service.getDownloadStatus();
      expect(result.status).toBe('completed');
      expect(result.completed).toBe(5);
    });
  });
});
