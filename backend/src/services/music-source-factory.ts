import { MusicSource } from './music-source.js';
import { LocalFileSource } from './local-file-source.js';

export function createMusicSource(): MusicSource {
  return new LocalFileSource();
}
