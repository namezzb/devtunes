export interface ResolveResult {
  type: 'playlist' | 'song' | 'unknown';
  id: string | null;
  originalUrl: string;
  resolvedUrl?: string;
}

const SHORT_URL_HOST = '163cn.tv';
const MOBILE_DOMAIN = 'y.music.163.com';
const WEB_DOMAIN = 'music.163.com';

function isShortUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === SHORT_URL_HOST || parsed.hostname.includes(SHORT_URL_HOST);
  } catch {
    return false;
  }
}

export async function resolveShortUrl(url: string): Promise<ResolveResult> {
  if (!isShortUrl(url)) {
    return parseNeteaseUrl(url);
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
    });

    const resolvedUrl = response.url;
    return parseNeteaseUrl(resolvedUrl);
  } catch {
    return {
      type: 'unknown',
      id: null,
      originalUrl: url,
    };
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

function parseMobileUrl(url: URL): ResolveResult {
  if (url.pathname.startsWith('/m/playlist')) {
    const id = extractIdFromQuery(url, 'id');
    return { type: 'playlist', id, originalUrl: url.toString() };
  }

  if (url.pathname.startsWith('/m/song')) {
    const id = extractIdFromQuery(url, 'id');
    return { type: 'song', id, originalUrl: url.toString() };
  }

  return { type: 'unknown', id: null, originalUrl: url.toString() };
}

function parseWebUrl(url: URL): ResolveResult {
  // Handle /playlist and /m/playlist paths
  if (url.pathname.startsWith('/playlist') || url.pathname.startsWith('/m/playlist')) {
    const idFromQuery = extractIdFromQuery(url, 'id');
    if (idFromQuery) {
      return { type: 'playlist', id: idFromQuery, originalUrl: url.toString() };
    }

    const idFromPath = extractIdFromPath(url, 'playlist');
    if (idFromPath) {
      return { type: 'playlist', id: idFromPath, originalUrl: url.toString() };
    }
  }

  // Handle /song and /m/song paths
  if (url.pathname.startsWith('/song') || url.pathname.startsWith('/m/song')) {
    const id = extractIdFromQuery(url, 'id');
    return { type: 'song', id, originalUrl: url.toString() };
  }

  return { type: 'unknown', id: null, originalUrl: url.toString() };
}

function parseFragmentUrl(fragment: string): ResolveResult {
  if (!fragment || fragment === '#') {
    return { type: 'unknown', id: null, originalUrl: fragment };
  }

  const hashUrl = `https://music.163.com${fragment.startsWith('#') ? fragment : '#' + fragment}`;

  try {
    const parsed = new URL(hashUrl);
    return parseWebUrl(parsed);
  } catch {
    return { type: 'unknown', id: null, originalUrl: fragment };
  }
}

export function parseNeteaseUrl(url: string): ResolveResult {
  if (!url || url.trim() === '') {
    return { type: 'unknown', id: null, originalUrl: url };
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

    return { type: 'unknown', id: null, originalUrl: url };
  } catch {
    return { type: 'unknown', id: null, originalUrl: url };
  }
}
