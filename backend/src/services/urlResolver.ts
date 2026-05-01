import axios from 'axios';

const SHORT_URL_HOST = '163cn.tv';
const MOBILE_DOMAIN = 'y.music.163.com';
const WEB_DOMAIN = 'music.163.com';

export interface ResolveResult {
  type: 'playlist' | 'song' | 'unknown';
  id: string | null;
  originalUrl: string;
  resolvedUrl?: string;
}

interface ParsedUrl {
  type: 'playlist' | 'song' | 'unknown';
  id: string | null;
}

function isShortUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === SHORT_URL_HOST || parsed.hostname.includes(SHORT_URL_HOST);
  } catch {
    return false;
  }
}

function extractIdFromQuery(url: URL, paramName: string): string | null {
  const value = url.searchParams.get(paramName);
  return value ?? null;
}

function extractIdFromPath(url: URL, expectedSegment: string): string | null {
  const pathSegments = url.pathname.split('/').filter(Boolean);
  const index = pathSegments.indexOf(expectedSegment);

  if (index !== -1 && index + 1 < pathSegments.length) {
    return pathSegments[index + 1];
  }

  return null;
}

function parseMobileUrl(url: URL): ParsedUrl {
  if (url.pathname.startsWith('/m/playlist')) {
    const id = extractIdFromQuery(url, 'id');
    return { type: 'playlist', id };
  }

  if (url.pathname.startsWith('/m/song')) {
    const id = extractIdFromQuery(url, 'id');
    return { type: 'song', id };
  }

  return { type: 'unknown', id: null };
}

function parseWebUrl(url: URL): ParsedUrl {
  if (url.pathname.startsWith('/playlist') || url.pathname.startsWith('/m/playlist')) {
    const idFromQuery = extractIdFromQuery(url, 'id');
    if (idFromQuery) {
      return { type: 'playlist', id: idFromQuery };
    }

    const idFromPath = extractIdFromPath(url, 'playlist');
    if (idFromPath) {
      return { type: 'playlist', id: idFromPath };
    }
  }

  if (url.pathname.startsWith('/song') || url.pathname.startsWith('/m/song')) {
    const id = extractIdFromQuery(url, 'id');
    return { type: 'song', id };
  }

  if (url.hash) {
    const hashContent = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
    if (hashContent.startsWith('/playlist') || hashContent.startsWith('playlist')) {
      const queryStart = hashContent.indexOf('?');
      if (queryStart !== -1) {
        const queryString = hashContent.slice(queryStart + 1);
        const hashParams = new URLSearchParams(queryString);
        const id = hashParams.get('id');
        return { type: 'playlist', id };
      }
      return { type: 'playlist', id: null };
    }
    if (hashContent.startsWith('/song') || hashContent.startsWith('song')) {
      const queryStart = hashContent.indexOf('?');
      if (queryStart !== -1) {
        const queryString = hashContent.slice(queryStart + 1);
        const hashParams = new URLSearchParams(queryString);
        const id = hashParams.get('id');
        return { type: 'song', id };
      }
      return { type: 'song', id: null };
    }
  }

  return { type: 'unknown', id: null };
}

function parseFragmentUrl(fragment: string): ParsedUrl {
  if (!fragment || fragment === '#') {
    return { type: 'unknown', id: null };
  }

  const hashUrl = `https://music.163.com${fragment.startsWith('#') ? fragment : '#' + fragment}`;

  try {
    const parsed = new URL(hashUrl);
    return parseWebUrl(parsed);
  } catch {
    return { type: 'unknown', id: null };
  }
}

export function parseNeteaseUrl(url: string): ParsedUrl {
  if (!url || url.trim() === '') {
    return { type: 'unknown', id: null };
  }

  if (url.startsWith('#')) {
    return parseFragmentUrl(url);
  }

  try {
    const parsed = new URL(url);

    if (parsed.hostname === MOBILE_DOMAIN || parsed.hostname.endsWith(`.${MOBILE_DOMAIN}`)) {
      return parseMobileUrl(parsed);
    }

    if (parsed.hostname === WEB_DOMAIN || parsed.hostname.endsWith(`.${WEB_DOMAIN}`)) {
      return parseWebUrl(parsed);
    }

    return { type: 'unknown', id: null };
  } catch {
    return { type: 'unknown', id: null };
  }
}

export async function resolveNeteaseUrl(url: string): Promise<ResolveResult> {
  if (!url || url.trim() === '') {
    return { type: 'unknown', id: null, originalUrl: url };
  }

  let resolvedUrl = url;

  if (isShortUrl(url)) {
    try {
      const response = await axios.get(url, {
        maxRedirects: 5,
        timeout: 10000,
        validateStatus: (status) => status < 400,
      });
      resolvedUrl = response.request?.res?.responseUrl || response.config.url || url;
    } catch {
      return { type: 'unknown', id: null, originalUrl: url };
    }
  }

  const parsed = parseNeteaseUrl(resolvedUrl);

  return {
    type: parsed.type,
    id: parsed.id,
    originalUrl: url,
    resolvedUrl: resolvedUrl !== url ? resolvedUrl : undefined,
  };
}