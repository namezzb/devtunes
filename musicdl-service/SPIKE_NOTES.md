# musicdl Spike Findings

**Date:** 2026-05-05
**Library:** musicdl v2.11.3
**Client:** `NeteaseMusicClient`
**Playlist:** `https://music.163.com/#/playlist?id=7583298906` (4 tracks)

---

## 1. Exact Field Names and Types from `parseplaylist()`

### `SongInfo` dataclass fields

| Field | Type | Populated? | Notes |
|-------|------|------------|-------|
| `song_name` | `Optional[str]` | Always | e.g. "Ocean in Motion" |
| `singers` | `Optional[str]` | Always | Single string, e.g. "Eldar Kedem" |
| `album` | `Optional[str]` | Always | e.g. "Nothing but the Beat" |
| `source` | `Optional[str]` | Always | `"NeteaseMusicClient"` |
| `identifier` | `Optional[int]` | Always | Integer song ID, e.g. `1811562299` |
| `ext` | `Optional[str]` | Always | `"flac"` — appears to be the format/container |
| `duration` | `Optional[str]` | Always | `"00:03:14"` (HH:MM:SS string) |
| `duration_s` | `Optional[int]` | Always | `194` (integer seconds) |
| `file_size` | `Optional[str]` | Always | `"111.71 MB"` (human-readable string) |
| `file_size_bytes` | `Optional[int]` | Always | `117135392` (raw bytes) |
| `cover_url` | `Optional[str]` | Always | Full URL to album art |
| `download_url` | `Optional[Any]` | Always | Full HTTP URL to audio |
| `download_url_status` | `Dict[str, Any]` | Always | `{"ok": true, "ctype": "audio/mpeg; charset=UTF-8", "ext": "flac", ...}` |
| `lyric` | `Optional[str]` | Always | Full LRC format lyrics with timestamps |
| `work_dir` | `Optional[str]` | Always | Overridden by library — see Gotchas |
| `protocol` | `Optional[str]` | Always | `"HTTP"` |
| `raw_data` | `Dict[str, Any]` | Always | Full raw API response dict |
| `chunk_size` | `Optional[int]` | Always | `1048576` (1MB default) |
| `default_download_headers` | `Dict[str, Any]` | Always | Pre-configured headers |
| `default_download_cookies` | `Dict[str, Any]` | Always | Pre-configured cookies |
| `_save_path` | `Optional[str]` | 3/4 | The computed save path (computed lazily) |
| `bitrate` | `Optional[int]` | **Never** | Always `None` for these tracks |
| `codec` | `Optional[str]` | **Never** | Always `None` — despite `ext` being `"flac"` |
| `samplerate` | `Optional[int]` | **Never** | Always `None` |
| `channels` | `Optional[int]` | **Never** | Always `None` |
| `downloaded_contents` | `Optional[Any]` | **Never** | Only set after download |
| `episodes` | `Optional[list[SongInfo]]` | **Never** | Podcast/FM only |
| `root_source` | `Optional[str]` | **Never** | Always `None` |

### Key observation: `singers` is a single string, not a list

When there are multiple artists, they may appear separated by `/` or similar in the string — this needs confirmation with a multi-artist track.

---

## 2. File Naming Pattern

```
{song_name} - {identifier}.{ext}
```

**Example:** `Ocean in Motion - 1811562299.flac`

The `save_path` property in `SongInfo` computes this as:
```python
os.path.join(self.work_dir, f"{self.song_name} - {self.identifier}.{self.ext.removeprefix('.')}")
```

Duplicate files get a numeric suffix: `{song_name} - {identifier} (1).{ext}`

**Important:** The `identifier` is an **integer** (the Netease song ID), not a string. When constructing save paths programmatically, convert to `str(identifier)`.

---

## 3. Synchronous vs Async Download

**`download()` is synchronous / blocking.** It blocks until the download completes:

- 1 song (120 MB FLAC): **29.65 seconds** wall time
- The progress bar shows `NeteaseMusicClient._download >>> Ocean in Motion (Success)` with MB/s throughput
- The function returns `list[SongInfo]` with `downloaded_contents` populated after completion

The download uses threading internally (`num_threadings` parameter defaults to 5), but the public API call blocks until all downloads finish.

---

## 4. Timing: Parse 4-Song Playlist

- **Total parse time:** 29.10 seconds
- **Per song (average):** ~7.3 seconds
- This is slow because Netease API resolves each song's download URL individually
- The progress bar shows: `4 Songs Found in Playlist... Completed (4/4)`

---

## 5. Timing: Download 1 Song

- **Total download time:** 29.65 seconds
- **File size:** 120 MB (FLAC format)
- **Throughput:** ~4 MB/s
- FLAC downloads are large — expect 25-40 MB per minute per song
- For MP3/AAC the files would be much smaller (~5-15 MB) and faster

---

## 6. Errors and Gotchas

### Gotcha 1: `work_dir` gets overridden by the library
Even though we set `init_music_clients_cfg={'NeteaseMusicClient': {'work_dir': '/tmp/musicdl-spike/'}}`, the actual `work_dir` in the returned `SongInfo` objects was:
```
/tmp/musicdl-spike/NeteaseMusicClient/2026-05-05-14-37-01 traveling/
```
The library appends a subdirectory structure: `{source}/{timestamp} {playlist_name}/`. This means:
- Cannot predict exact save path without parsing the playlist first
- The `save_path` property on `SongInfo` is the authoritative source

### Gotcha 2: FLAC files are very large
All 4 songs were FLAC (~100-175 MB each). Downloading a full playlist of FLACs could consume significant bandwidth and disk space.

### Gotcha 3: `ext` vs actual content type
- `ext` = `"flac"` (container format)
- `download_url_status.ctype` = `"audio/mpeg; charset=UTF-8"` (actual MIME type from server)
- These may not always agree — the MIME type suggests MPEG even though ext says FLAC

### Gotcha 4: Parsing is slow
29 seconds for 4 songs is slow. For production, this might need caching or background job processing.

### Gotcha 5: `bitrate`, `codec`, `samplerate`, `channels` are always `None`
These fields from the `SongInfo` dataclass are not populated by the Netease Music source. If you need audio quality metadata, you'll need to probe the downloaded file with tools like `mutagen` or `ffprobe`.

### Gotcha 6: URL hash fragment
The playlist URL with `#/` hash fragment (`music.163.com/#/playlist?id=...`) worked fine. The library strips the fragment internally.

---

## 7. MusicClient Constructor Parameters

```python
MusicClient(
    music_sources=["NeteaseMusicClient"],             # Required: list of source names
    init_music_clients_cfg={                           # Optional: per-source config
        "NeteaseMusicClient": {
            "work_dir": "/tmp/musicdl-spike/",         # Base work dir (see Gotcha 1)
            "search_size_per_source": 5,               # Default: 5
            "auto_set_proxies": False,                  # Default: False
            "random_update_ua": False,                  # Default: False
            "max_retries": 3,                           # Default: 3
            "maintain_session": False,                  # Default: False
            "disable_print": True,                      # Default: True
        }
    },
    clients_threadings={},                              # Per-source thread counts
    requests_overrides={},                              # Per-source request overrides
    search_rules={},                                    # Per-source search rules
)
```

Available sources (from registered modules):
- `NeteaseMusicClient` — Netease Cloud Music
- Many others (QQMusic, Kugou, Kuwo, etc.) — see musicdl documentation

---

## Summary for Tasks 4 and 5

| Item | Value |
|------|-------|
| Download blocks? | **Yes**, synchronous |
| File pattern | `{name} - {id}.{ext}` |
| Identifier type | `int` (must cast to `str` for path building) |
| `singers` type | Single `str` (not `list[str]`) |
| Work dir control | Library appends `{source}/{timestamp} {playlist}/` subdirectory |
| Parse speed | ~7.3 sec/song |
| Download speed | ~4 MB/s (FLAC), likely faster for MP3 |
| Quality fields (`bitrate`, etc.) | Always `None` from Netease source |
