import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { parseFile, selectCover } from 'music-metadata';
import type { MusicSource } from './music-source.js';
import type { Track, Playlist, SearchResult, Lyric } from '../types/music.js';

const SUPPORTED_EXTENSIONS = new Set(['.mp3', '.flac', '.wav', '.ogg', '.m4a']);
const LOCAL_LIBRARY_PLAYLIST_ID = 'local-library';

interface CacheEntry {
  tracks: Track[];
  fileStats: Record<string, number>;
}

function generateTrackId(filePath: string): string {
  return crypto.createHash('md5').update(filePath).digest('hex');
}

function resolveLibraryPath(): string {
  const envPath = process.env.MUSIC_LIBRARY_PATH;
  if (envPath) {
    if (envPath.startsWith('~')) {
      return path.join(os.homedir(), envPath.slice(1));
    }
    return path.resolve(envPath);
  }
  return path.join(os.homedir(), 'Music');
}

function getTitleFromPath(filePath: string): string {
  return path.basename(filePath, path.extname(filePath));
}

export class LocalFileSource implements MusicSource {
  readonly name = 'local';
  private libraryPath: string;
  private cachePath: string;
  private cache: CacheEntry | null = null;

  constructor(libraryPath?: string) {
    this.libraryPath = libraryPath ?? resolveLibraryPath();
    this.cachePath = path.join(process.cwd(), 'data', 'library-cache.json');
  }

  getLibraryPath(): string {
    return this.libraryPath;
  }

  async getPlaylist(id: string): Promise<Playlist> {
    const tracks = await this.scanTracks();
    if (id !== LOCAL_LIBRARY_PLAYLIST_ID) {
      throw new Error(`Unknown playlist: ${id}`);
    }
    return this.createLocalPlaylist(tracks.length);
  }

  async getPlaylistTracks(playlistId: string): Promise<{ playlist: Playlist; tracks: Track[] }> {
    if (playlistId !== LOCAL_LIBRARY_PLAYLIST_ID) {
      throw new Error(`Unknown playlist: ${playlistId}`);
    }
    const tracks = await this.scanTracks();
    return { playlist: this.createLocalPlaylist(tracks.length), tracks };
  }

  async searchSongs(query: string, limit: number = 20): Promise<SearchResult> {
    const tracks = await this.scanTracks();
    const lowerQuery = query.toLowerCase();
    const matched = tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(lowerQuery) ||
        t.artist.toLowerCase().includes(lowerQuery)
    );
    return {
      songs: matched.slice(0, limit),
      total: matched.length,
    };
  }

  async getTrackUrl(trackId: string): Promise<string | null> {
    const tracks = await this.scanTracks();
    const found = tracks.find((t) => t.id === trackId);
    if (!found) {
      return null;
    }
    return `/api/library/audio/${trackId}`;
  }

  async getLyric(_trackId: string): Promise<Lyric | null> {
    return null;
  }

  private createLocalPlaylist(trackCount: number): Playlist {
    return {
      id: LOCAL_LIBRARY_PLAYLIST_ID,
      name: 'Local Library',
      coverImgUrl: '',
      description: `Your local music library (${trackCount} tracks)`,
      trackCount,
      playCount: 0,
      creator: {
        nickname: 'DEVTunes',
        avatarUrl: '',
      },
    };
  }

  private async scanLibrary(): Promise<string[]> {
    const files: string[] = [];

    const walk = async (dir: string): Promise<void> => {
      let entries: fs.Dirent[];
      try {
        entries = await fs.promises.readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (SUPPORTED_EXTENSIONS.has(ext)) {
            files.push(fullPath);
          }
        }
      }
    };

    await walk(this.libraryPath);
    return files;
  }

  private async scanTracks(): Promise<Track[]> {
    const files = await this.scanLibrary();

    if (!this.cache) {
      this.cache = await this.loadCache();
    }

    const currentStats: Record<string, number> = {};
    for (const file of files) {
      try {
        const stat = await fs.promises.stat(file);
        currentStats[file] = stat.mtimeMs;
      } catch {
        // File became unreadable between scan and stat, skip it
      }
    }

    if (this.cache && !this.hasFileChanges(currentStats)) {
      return this.cache.tracks;
    }

    const tracks: Track[] = [];
    const fileStats: Record<string, number> = {};

    for (const file of files) {
      const mtime = currentStats[file];
      if (mtime === undefined) {
        continue;
      }
      try {
        const track = await this.parseTrack(file);
        tracks.push(track);
        fileStats[file] = mtime;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`Skipping unreadable file: ${file} - ${msg}`);
      }
    }

    tracks.sort((a, b) => a.title.localeCompare(b.title));

    this.cache = { tracks, fileStats };
    await this.saveCache(this.cache);

    return tracks;
  }

  private hasFileChanges(currentStats: Record<string, number>): boolean {
    if (!this.cache) {
      return true;
    }

    const cachedFiles = Object.keys(this.cache.fileStats);
    const currentFiles = Object.keys(currentStats);

    if (cachedFiles.length !== currentFiles.length) {
      return true;
    }

    for (const file of currentFiles) {
      if (this.cache.fileStats[file] !== currentStats[file]) {
        return true;
      }
    }

    for (const file of cachedFiles) {
      if (currentStats[file] === undefined) {
        return true;
      }
    }

    return false;
  }

  private async parseTrack(filePath: string): Promise<Track> {
    const id = generateTrackId(filePath);
    const metadata = await parseFile(filePath, { duration: true, skipCovers: false });
    const { common, format } = metadata;

    const title = common.title || getTitleFromPath(filePath);
    const artist = common.artist || 'Unknown';
    const duration = format.duration || 0;

    let coverUrl = '';
    const cover = selectCover(common.picture);
    if (cover) {
      const base64 = Buffer.from(cover.data).toString('base64');
      coverUrl = `data:${cover.format};base64,${base64}`;
    }

    return {
      id,
      title,
      artist,
      coverUrl,
      duration: Math.round(duration),
      url: `/api/library/audio/${id}`,
      source: 'local',
    };
  }

  private async loadCache(): Promise<CacheEntry | null> {
    try {
      const data = await fs.promises.readFile(this.cachePath, 'utf-8');
      return JSON.parse(data) as CacheEntry;
    } catch {
      return null;
    }
  }

  private async saveCache(cache: CacheEntry): Promise<void> {
    try {
      const dir = path.dirname(this.cachePath);
      await fs.promises.mkdir(dir, { recursive: true });
      await fs.promises.writeFile(
        this.cachePath,
        JSON.stringify(cache, null, 2),
        'utf-8'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Failed to save library cache: ${msg}`);
    }
  }
}

export { generateTrackId, resolveLibraryPath, getTitleFromPath, LOCAL_LIBRARY_PLAYLIST_ID };
