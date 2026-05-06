import { describe, it, expect } from 'vitest';
import {
  isValidNeteaseUrl,
  extractPlaylistId,
} from '../../src/services/url-resolver.js';

describe('isValidNeteaseUrl', () => {
  it('accepts music.163.com playlist URLs', () => {
    expect(isValidNeteaseUrl('https://music.163.com/playlist?id=7583298906')).toBe(true);
  });

  it('accepts music.163.com with subdomain', () => {
    expect(isValidNeteaseUrl('https://y.music.163.com/m/playlist?id=123')).toBe(true);
  });

  it('accepts 163cn.tv short URLs', () => {
    expect(isValidNeteaseUrl('https://163cn.tv/6xv6M81')).toBe(true);
  });

  it('accepts music.126.net URLs', () => {
    expect(isValidNeteaseUrl('https://music.126.net/playlist?id=456')).toBe(true);
  });

  it('accepts URLs with extra path segments', () => {
    expect(isValidNeteaseUrl('https://music.163.com/#/playlist?id=789')).toBe(true);
  });

  it('rejects non-Netease URLs', () => {
    expect(isValidNeteaseUrl('https://spotify.com/playlist/abc')).toBe(false);
  });

  it('rejects soundcloud URLs', () => {
    expect(isValidNeteaseUrl('https://soundcloud.com/user/playlist')).toBe(false);
  });

  it('rejects random strings', () => {
    expect(isValidNeteaseUrl('not a url at all')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidNeteaseUrl('')).toBe(false);
  });

  it('rejects empty input', () => {
    expect(isValidNeteaseUrl('   ')).toBe(false);
  });

  it('rejects null-like inputs gracefully', () => {
    expect(isValidNeteaseUrl(null as unknown as string)).toBe(false);
    expect(isValidNeteaseUrl(undefined as unknown as string)).toBe(false);
  });
});

describe('extractPlaylistId', () => {
  it('extracts id from query parameters', () => {
    expect(extractPlaylistId('https://music.163.com/playlist?id=7583298906')).toBe('7583298906');
  });

  it('extracts id when other query params present', () => {
    expect(extractPlaylistId('https://music.163.com/playlist?id=7583298906&userid=123'))
      .toBe('7583298906');
  });

  it('extracts id from mobile URL', () => {
    expect(extractPlaylistId('https://y.music.163.com/m/playlist?id=123456')).toBe('123456');
  });

  it('extracts id from fragment-based URL', () => {
    expect(extractPlaylistId('https://music.163.com/#/playlist?id=789')).toBe('789');
  });

  it('returns null when no id param', () => {
    expect(extractPlaylistId('https://music.163.com/playlist')).toBeNull();
  });

  it('returns null for non-Netease URLs', () => {
    expect(extractPlaylistId('https://spotify.com/playlist?id=123')).toBe('123');
  });

  it('returns null for invalid URL strings', () => {
    expect(extractPlaylistId('not a url')).toBeNull();
  });
});
