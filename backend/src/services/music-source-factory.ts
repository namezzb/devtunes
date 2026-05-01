import { MusicSource } from './music-source.js';
import { LocalFileSource } from './local-file-source.js';
import { neteaseSource } from './netease-source.js';

type SourceType = 'local' | 'netease' | 'all';

const DEFAULT_SOURCE: SourceType = 'local';

function getConfiguredSource(): SourceType {
  const env = process.env.MUSIC_SOURCE;
  if (env === 'local' || env === 'netease' || env === 'all') {
    return env;
  }
  return DEFAULT_SOURCE;
}

export function createMusicSource(): MusicSource {
  const source = getConfiguredSource();

  if (source === 'local') {
    return new LocalFileSource();
  }

  if (source === 'netease') {
    return neteaseSource;
  }

  return new LocalFileSource();
}

export function getSourceType(): SourceType {
  return getConfiguredSource();
}

export { SourceType };
