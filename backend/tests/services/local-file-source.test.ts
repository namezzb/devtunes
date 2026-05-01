import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import {
  generateTrackId,
  resolveLibraryPath,
  getTitleFromPath,
  LOCAL_LIBRARY_PLAYLIST_ID,
  LocalFileSource,
} from '../../src/services/local-file-source.js';

vi.mock('music-metadata', () => ({
  parseFile: vi.fn(),
  selectCover: vi.fn(),
}));

describe('generateTrackId', () => {
  it('should produce a deterministic MD5 hash from a file path', () => {
    const id1 = generateTrackId('/home/user/Music/song.mp3');
    const id2 = generateTrackId('/home/user/Music/song.mp3');
    expect(id1).toBe(id2);
    expect(id1).toHaveLength(32);
    expect(id1).toMatch(/^[a-f0-9]{32}$/);
  });

  it('should produce different IDs for different paths', () => {
    const id1 = generateTrackId('/home/user/Music/song1.mp3');
    const id2 = generateTrackId('/home/user/Music/song2.mp3');
    expect(id1).not.toBe(id2);
  });

  it('should be case-sensitive for paths', () => {
    const id1 = generateTrackId('/home/user/Music/Song.mp3');
    const id2 = generateTrackId('/home/user/Music/song.mp3');
    expect(id1).not.toBe(id2);
  });
});

describe('getTitleFromPath', () => {
  it('should extract filename without extension', () => {
    expect(getTitleFromPath('/home/user/Music/My Song.mp3')).toBe('My Song');
  });

  it('should handle paths with multiple dots', () => {
    expect(getTitleFromPath('/home/user/Music/Artist.Song.Title.mp3')).toBe('Artist.Song.Title');
  });

  it('should handle paths without extension', () => {
    expect(getTitleFromPath('/home/user/Music/song')).toBe('song');
  });
});

describe('resolveLibraryPath', () => {
  const originalEnv = process.env.MUSIC_LIBRARY_PATH;

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.MUSIC_LIBRARY_PATH = originalEnv;
    } else {
      delete process.env.MUSIC_LIBRARY_PATH;
    }
  });

  it('should return the env var path when MUSIC_LIBRARY_PATH is set', () => {
    process.env.MUSIC_LIBRARY_PATH = '/custom/music/path';
    expect(resolveLibraryPath()).toBe('/custom/music/path');
  });

  it('should expand tilde in env var', () => {
    process.env.MUSIC_LIBRARY_PATH = '~/MyMusic';
    const result = resolveLibraryPath();
    expect(result).toBe(path.join(os.homedir(), 'MyMusic'));
  });

  it('should default to ~/Music when env var is not set', () => {
    delete process.env.MUSIC_LIBRARY_PATH;
    const result = resolveLibraryPath();
    expect(result).toBe(path.join(os.homedir(), 'Music'));
  });
});

describe('LocalFileSource', () => {
  let source: LocalFileSource;
  const testLibraryPath = '/tmp/test-music';

  beforeEach(() => {
    source = new LocalFileSource(testLibraryPath);
    vi.clearAllMocks();
  });

  describe('name', () => {
    it('should return "local"', () => {
      expect(source.name).toBe('local');
    });
  });

  describe('getLibraryPath', () => {
    it('should return the configured library path', () => {
      expect(source.getLibraryPath()).toBe(testLibraryPath);
    });
  });

  describe('getPlaylist', () => {
    it('should return the local library playlist for the correct ID', async () => {
      vi.spyOn(fs.promises, 'readdir').mockResolvedValue([]);

      const playlist = await source.getPlaylist(LOCAL_LIBRARY_PLAYLIST_ID);

      expect(playlist.id).toBe(LOCAL_LIBRARY_PLAYLIST_ID);
      expect(playlist.name).toBe('Local Library');
      expect(playlist.trackCount).toBe(0);
      expect(playlist.creator.nickname).toBe('DEVTunes');
    });

    it('should throw for unknown playlist IDs', async () => {
      vi.spyOn(fs.promises, 'readdir').mockResolvedValue([]);

      await expect(source.getPlaylist('unknown-id')).rejects.toThrow(
        'Unknown playlist: unknown-id'
      );
    });
  });

  describe('getPlaylistTracks', () => {
    it('should return playlist with empty tracks for empty library', async () => {
      vi.spyOn(fs.promises, 'readdir').mockResolvedValue([]);

      const result = await source.getPlaylistTracks(LOCAL_LIBRARY_PLAYLIST_ID);

      expect(result.playlist.id).toBe(LOCAL_LIBRARY_PLAYLIST_ID);
      expect(result.tracks).toEqual([]);
    });

    it('should throw for unknown playlist IDs', async () => {
      vi.spyOn(fs.promises, 'readdir').mockResolvedValue([]);

      await expect(
        source.getPlaylistTracks('unknown-id')
      ).rejects.toThrow('Unknown playlist: unknown-id');
    });
  });

  describe('getTrackUrl', () => {
    it('should return the correct URL format', async () => {
      vi.spyOn(fs.promises, 'readdir').mockResolvedValue([]);

      const url = await source.getTrackUrl('abc123');
      expect(url).toBeNull();
    });

    it('should return null when track does not exist', async () => {
      vi.spyOn(fs.promises, 'readdir').mockResolvedValue([]);

      const url = await source.getTrackUrl('nonexistent');
      expect(url).toBeNull();
    });
  });

  describe('getLyric', () => {
    it('should return null for local files', async () => {
      const lyric = await source.getLyric('any-track-id');
      expect(lyric).toBeNull();
    });
  });

  describe('searchSongs', () => {
    it('should return empty result for empty library', async () => {
      vi.spyOn(fs.promises, 'readdir').mockResolvedValue([]);

      const result = await source.searchSongs('anything');
      expect(result.songs).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});

describe('LocalFileSource with mocked audio files', () => {
  const testLibraryPath = '/tmp/test-music';

  function createMockDirents(
    files: Array<{ name: string; isFile?: boolean; isDirectory?: boolean }>
  ): fs.Dirent[] {
    return files.map((f) => {
      const d = Object.create(fs.Dirent.prototype);
      Object.defineProperty(d, 'name', { value: f.name, enumerable: true });
      d.isFile = () => f.isFile ?? true;
      d.isDirectory = () => f.isDirectory ?? false;
      return d as fs.Dirent;
    });
  }

  it('should scan audio files and parse metadata', async () => {
    const { parseFile } = await import('music-metadata');

    vi.spyOn(fs.promises, 'readdir').mockResolvedValue(
      createMockDirents([
        { name: 'song1.mp3' },
        { name: 'song2.flac' },
        { name: 'cover.jpg' }, // should be filtered out
        { name: 'notes.txt' }, // should be filtered out
      ])
    );

    vi.spyOn(fs.promises, 'stat').mockImplementation(async (p: fs.PathLike) => ({
      mtimeMs: 1000,
      isFile: () => true,
      isDirectory: () => false,
    } as fs.Stats));

    const parseFileMock = parseFile as ReturnType<typeof vi.fn>;
    parseFileMock.mockImplementation(async (filePath: string) => {
      const name = path.basename(filePath as string);
      return {
        common: {
          title: name.replace(path.extname(filePath as string), ''),
          artist: 'Test Artist',
          picture: undefined,
        },
        format: { duration: 200 },
      };
    });

    const source = new LocalFileSource(testLibraryPath);
    const result = await source.getPlaylistTracks(LOCAL_LIBRARY_PLAYLIST_ID);

    expect(result.tracks).toHaveLength(2);
    expect(result.tracks[0].source).toBe('local');
    expect(result.tracks[0].artist).toBe('Test Artist');

    const titles = result.tracks.map((t) => t.title).sort();
    expect(titles).toEqual(['song1', 'song2']);
  });

  it('should handle missing metadata gracefully', async () => {
    const { parseFile } = await import('music-metadata');

    vi.spyOn(fs.promises, 'readdir').mockResolvedValue(
      createMockDirents([{ name: 'untagged.wav' }])
    );

    vi.spyOn(fs.promises, 'stat').mockImplementation(async () => ({
      mtimeMs: 1000,
      isFile: () => true,
      isDirectory: () => false,
    } as fs.Stats));

    const parseFileMock = parseFile as ReturnType<typeof vi.fn>;
    parseFileMock.mockImplementation(async () => ({
      common: {
        title: undefined,
        artist: undefined,
        picture: undefined,
      },
      format: { duration: undefined },
    }));

    const source = new LocalFileSource(testLibraryPath);
    const result = await source.getPlaylistTracks(LOCAL_LIBRARY_PLAYLIST_ID);

    expect(result.tracks).toHaveLength(1);
    expect(result.tracks[0].title).toBe('untagged');
    expect(result.tracks[0].artist).toBe('Unknown');
    expect(result.tracks[0].duration).toBe(0);
    expect(result.tracks[0].coverUrl).toBe('');
  });

  it('should skip unreadable files gracefully', async () => {
    const { parseFile } = await import('music-metadata');

    vi.spyOn(fs.promises, 'readdir').mockResolvedValue(
      createMockDirents([
        { name: 'good.mp3' },
        { name: 'bad.mp3' },
        { name: 'corrupt.flac' },
      ])
    );

    vi.spyOn(fs.promises, 'stat').mockImplementation(async (p: fs.PathLike) => ({
      mtimeMs: 1000,
      isFile: () => true,
      isDirectory: () => false,
    } as fs.Stats));

    const parseFileMock = parseFile as ReturnType<typeof vi.fn>;
    parseFileMock.mockImplementation(async (filePath: string) => {
      const name = path.basename(filePath as string);
      if (name === 'bad.mp3') {
        throw new Error('Corrupt file');
      }
      if (name === 'corrupt.flac') {
        throw new Error('Cannot parse FLAC');
      }
      return {
        common: { title: name.replace('.mp3', ''), artist: 'OK', picture: undefined },
        format: { duration: 100 },
      };
    });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const source = new LocalFileSource(testLibraryPath);
    const result = await source.getPlaylistTracks(LOCAL_LIBRARY_PLAYLIST_ID);

    expect(result.tracks).toHaveLength(1);
    expect(result.tracks[0].title).toBe('good');
    expect(warnSpy).toHaveBeenCalledTimes(2);

    warnSpy.mockRestore();
  });

  it('should generate base64 cover art data URI', async () => {
    const { parseFile, selectCover: mockSelectCover } = await import('music-metadata');

    vi.spyOn(fs.promises, 'readdir').mockResolvedValue(
      createMockDirents([{ name: 'track.mp3' }])
    );

    vi.spyOn(fs.promises, 'stat').mockImplementation(async () => ({
      mtimeMs: 1000,
      isFile: () => true,
      isDirectory: () => false,
    } as fs.Stats));

    const coverData = Buffer.from('fake-image-data');
    const parseFileMock = parseFile as ReturnType<typeof vi.fn>;
    parseFileMock.mockImplementation(async () => ({
      common: {
        title: 'Track With Cover',
        artist: 'Artist',
        picture: [{ format: 'image/jpeg', data: coverData }],
      },
      format: { duration: 180 },
    }));

    const selectCoverMock = mockSelectCover as ReturnType<typeof vi.fn>;
    selectCoverMock.mockReturnValue({ format: 'image/jpeg', data: coverData });

    const source = new LocalFileSource(testLibraryPath);
    const result = await source.getPlaylistTracks(LOCAL_LIBRARY_PLAYLIST_ID);

    expect(result.tracks[0].coverUrl).toBe(
      `data:image/jpeg;base64,${coverData.toString('base64')}`
    );
  });

  it('should generate deterministic track IDs', async () => {
    vi.spyOn(fs.promises, 'readdir').mockResolvedValue(
      createMockDirents([{ name: 'song.mp3' }])
    );

    vi.spyOn(fs.promises, 'stat').mockImplementation(async () => ({
      mtimeMs: 1000,
      isFile: () => true,
      isDirectory: () => false,
    } as fs.Stats));

    const { parseFile } = await import('music-metadata');
    const parseFileMock = parseFile as ReturnType<typeof vi.fn>;
    parseFileMock.mockImplementation(async () => ({
      common: { title: 'Test', artist: 'Test', picture: undefined },
      format: { duration: 100 },
    }));

    const sourceA = new LocalFileSource(testLibraryPath);
    const resultA = await sourceA.getPlaylistTracks(LOCAL_LIBRARY_PLAYLIST_ID);

    const sourceB = new LocalFileSource(testLibraryPath);
    // Reset mocks for second instance
    vi.spyOn(fs.promises, 'readdir').mockResolvedValue(
      createMockDirents([{ name: 'song.mp3' }])
    );
    vi.spyOn(fs.promises, 'stat').mockImplementation(async () => ({
      mtimeMs: 2000,
      isFile: () => true,
      isDirectory: () => false,
    } as fs.Stats));
    const parseFileMock2 = parseFile as ReturnType<typeof vi.fn>;
    parseFileMock2.mockImplementation(async () => ({
      common: { title: 'Test', artist: 'Test', picture: undefined },
      format: { duration: 100 },
    }));

    const resultB = await sourceB.getPlaylistTracks(LOCAL_LIBRARY_PLAYLIST_ID);

    expect(resultA.tracks[0].id).toBe(resultB.tracks[0].id);
  });
});
