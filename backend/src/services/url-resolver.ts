import axios from 'axios';

const NETEASE_URL_PATTERNS = [
  /music\.163\.com/i,
  /y\.music\.163\.com/i,
  /163cn\.tv/i,
  /music\.126\.net/i,
];

export function isValidNeteaseUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const hostname = new URL(url).hostname;
    return NETEASE_URL_PATTERNS.some((p) => p.test(hostname));
  } catch {
    return false;
  }
}

export function extractPlaylistId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const idFromQuery = parsed.searchParams.get('id');
    if (idFromQuery) return idFromQuery;
    const fragment = parsed.hash;
    const match = fragment.match(/[?&]id=(\d+)/);
    if (match) return match[1];
    return null;
  } catch {
    return null;
  }
}

export async function resolveShortUrl(url: string, timeoutMs = 5000): Promise<string> {
  try {
    const response = await axios.head(url, {
      maxRedirects: 10,
      timeout: timeoutMs,
      validateStatus: () => true,
    });
    return response.request?.res?.responseUrl || url;
  } catch {
    return url;
  }
}
