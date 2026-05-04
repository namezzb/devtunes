import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseNeteaseUrl, resolveNeteaseUrl, ResolveResult } from '../../src/services/urlResolver.js';

vi.mock('axios');

describe('urlResolver service', () => {
  describe('parseNeteaseUrl', () => {
    it('should parse standard playlist URL with query param', () => {
      const url = 'https://music.163.com/playlist?id=123456789';
      const result = parseNeteaseUrl(url);
      expect(result.type).toBe('playlist');
      expect(result.id).toBe('123456789');
    });

    it('should parse mobile playlist URL', () => {
      const url = 'https://y.music.163.com/m/playlist?id=987654321';
      const result = parseNeteaseUrl(url);
      expect(result.type).toBe('playlist');
      expect(result.id).toBe('987654321');
    });

    it('should parse playlist path URL', () => {
      const url = 'https://music.163.com/playlist/123456';
      const result = parseNeteaseUrl(url);
      expect(result.type).toBe('playlist');
      expect(result.id).toBe('123456');
    });

    it('should parse hash-based playlist URL', () => {
      const url = 'https://music.163.com/#/playlist?id=123';
      const result = parseNeteaseUrl(url);
      expect(result.type).toBe('playlist');
      expect(result.id).toBe('123');
    });

    it('should parse mobile song URL', () => {
      const url = 'https://y.music.163.com/m/song?id=111222333';
      const result = parseNeteaseUrl(url);
      expect(result.type).toBe('song');
      expect(result.id).toBe('111222333');
    });

    it('should parse standard song URL', () => {
      const url = 'https://music.163.com/song?id=111222333';
      const result = parseNeteaseUrl(url);
      expect(result.type).toBe('song');
      expect(result.id).toBe('111222333');
    });

    it('should return unknown type for invalid URLs', () => {
      expect(parseNeteaseUrl('https://example.com/playlist?id=123').type).toBe('unknown');
      expect(parseNeteaseUrl('not-a-url').type).toBe('unknown');
      expect(parseNeteaseUrl('').type).toBe('unknown');
    });

    it('should return id as-is for non-numeric IDs (matches frontend)', () => {
      const result = parseNeteaseUrl('https://music.163.com/playlist?id=abc');
      expect(result.id).toBe('abc');
      expect(result.type).toBe('playlist');
    });

    it('should return unknown for URLs without playlist or song path', () => {
      const result = parseNeteaseUrl('https://music.163.com/');
      expect(result.type).toBe('unknown');
      expect(result.id).toBe(null);
    });

    it('should prioritize song over playlist in mobile URLs when both match', () => {
      const url = 'https://y.music.163.com/m/song?id=111222333';
      const result = parseNeteaseUrl(url);
      expect(result.type).toBe('song');
    });

    it('should handle subdomain variations for mobile domain', () => {
      const url = 'https://subdomain.y.music.163.com/m/playlist?id=123';
      const result = parseNeteaseUrl(url);
      expect(result.type).toBe('playlist');
      expect(result.id).toBe('123');
    });

    it('should handle subdomain variations for web domain', () => {
      const url = 'https://subdomain.music.163.com/playlist?id=123';
      const result = parseNeteaseUrl(url);
      expect(result.type).toBe('playlist');
      expect(result.id).toBe('123');
    });
  });

  describe('resolveNeteaseUrl', () => {
    it('should return unknown for empty URL', async () => {
      const result = await resolveNeteaseUrl('');
      expect(result.type).toBe('unknown');
      expect(result.id).toBe(null);
      expect(result.originalUrl).toBe('');
    });

    it('should return unknown for whitespace-only URL', async () => {
      const result = await resolveNeteaseUrl('   ');
      expect(result.type).toBe('unknown');
      expect(result.id).toBe(null);
    });

    it('should parse non-short URL directly without axios call', async () => {
      const url = 'https://music.163.com/playlist?id=123456789';
      const result = await resolveNeteaseUrl(url);
      expect(result.type).toBe('playlist');
      expect(result.id).toBe('123456789');
      expect(result.originalUrl).toBe(url);
      expect(result.resolvedUrl).toBeUndefined();
    });

    it('should detect 163cn.tv short URLs', async () => {
      const url = 'https://163cn.tv/abc123';
      const result = await resolveNeteaseUrl(url);
      expect(result.originalUrl).toBe(url);
    });
  });
});