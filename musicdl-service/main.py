import os
from typing import Any, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from concurrent.futures import ThreadPoolExecutor
from typing import List as PyList
from urllib.parse import urlparse, parse_qs
import requests as http_requests

PORT = int(os.getenv("PORT", "3002"))
HOST = os.getenv("HOST", "0.0.0.0")

musicdl_available = False
MusicClient: Optional[type] = None

try:
    from musicdl.musicdl import MusicClient as _MusicClient

    MusicClient = _MusicClient
    musicdl_available = True
except ImportError:
    MusicClient = None


class ParseRequest(BaseModel):
    url: str


class SongResponse(BaseModel):
    song_name: str
    singers: str
    album: str
    duration_s: int
    cover_url: str
    identifier: str
    ext: str
    download_url: str


class ParseResponse(BaseModel):
    success: bool
    data: Optional[list[SongResponse]] = None
    error: Optional[str] = None


class HealthResponse(BaseModel):
    status: str


class DownloadRequest(BaseModel):
    playlist_url: str
    target_dir: str
    song_identifiers: Optional[PyList[str]] = None


class DownloadError(BaseModel):
    song: str
    error: str


class DownloadData(BaseModel):
    total: int
    downloaded: int
    skipped: int
    failed: int
    errors: PyList[DownloadError] = []


class DownloadResponse(BaseModel):
    success: bool
    data: Optional[DownloadData] = None
    error: Optional[str] = None


class DownloadStatusResponse(BaseModel):
    total: int
    completed: int
    current_song: str
    status: str


_download_progress = {
    "total": 0,
    "completed": 0,
    "current_song": "",
    "status": "idle",
}


app = FastAPI(
    title="musicdl-service",
    description="Wraps musicdl for Netease Cloud Music playlist parsing",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _serialize_song(song: Any) -> SongResponse:
    raw_id = song.identifier
    return SongResponse(
        song_name=song.song_name or "",
        singers=song.singers or "",
        album=song.album or "",
        duration_s=song.duration_s or 0,
        cover_url=song.cover_url or "",
        identifier=str(raw_id) if raw_id is not None else "",
        ext=song.ext or "",
        download_url=song.download_url or "",
    )


def _file_exists_for_song(target_dir: str, identifier: Any, ext: str) -> bool:
    pattern = f" - {identifier}.{ext}"
    for root, _, files in os.walk(target_dir):
        for f in files:
            if pattern in f:
                return True
    return False


def _download_with_timeout(client: Any, song: Any, timeout: int = 60) -> bool:
    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(client.download, [song])
        try:
            future.result(timeout=timeout)
            return True
        except Exception:
            return False


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


def _resolve_playlist_url(url: str, timeout: int = 10) -> str:
    """Resolve short URLs (163cn.tv) and extract playlist ID from query params.
    
    Converts URLs like https://music.163.com/playlist?id=7908897764 
    into musicdl-compatible format https://music.163.com/#/playlist?id=7908897764
    """
    # Step 1: Follow redirects to get the final URL
    resolved_url = url
    try:
        resp = http_requests.get(url, allow_redirects=True, timeout=timeout,
                                  headers={'User-Agent': 'Mozilla/5.0'})
        resolved_url = resp.url
    except Exception:
        pass

    # Step 2: Extract playlist ID from query params
    playlist_id = None
    try:
        parsed = urlparse(resolved_url)
        query_params = parse_qs(parsed.query)
        playlist_id = query_params.get('id', [None])[0]
        # Also try fragment-based extraction
        if not playlist_id and parsed.fragment:
            frag_query = parse_qs(urlparse(parsed.fragment).query)
            playlist_id = frag_query.get('id', [None])[0]
    except Exception:
        pass

    # Step 3: Return a musicdl-compatible URL
    if playlist_id:
        return f"https://music.163.com/#/playlist?id={playlist_id}"
    return url


@app.post("/parse", response_model=ParseResponse)
def parse_playlist(body: ParseRequest) -> ParseResponse:
    if not musicdl_available or MusicClient is None:
        return ParseResponse(
            success=False,
            error="musicdl library is not installed or could not be imported",
        )

    url = body.url.strip()
    if not url:
        return ParseResponse(success=False, error="url is required and cannot be empty")

    try:
        resolved_url = _resolve_playlist_url(url)
        client = MusicClient(
            music_sources=["NeteaseMusicClient"],
            init_music_clients_cfg={
                "NeteaseMusicClient": {
                    "disable_print": True,
                }
            },
        )
        songs = client.parseplaylist(resolved_url)
        data = [_serialize_song(s) for s in songs]
        return ParseResponse(success=True, data=data)
    except Exception as e:
        return ParseResponse(success=False, error=f"{type(e).__name__}: {e}")


@app.post("/download", response_model=DownloadResponse)
def download_playlist(body: DownloadRequest) -> DownloadResponse:
    if not musicdl_available or MusicClient is None:
        return DownloadResponse(
            success=False,
            error="musicdl library is not installed or could not be imported",
        )

    playlist_url = body.playlist_url.strip()
    if not playlist_url:
        return DownloadResponse(
            success=False,
            error="playlist_url is required and cannot be empty",
        )

    target_dir = body.target_dir.strip()
    if not target_dir:
        return DownloadResponse(
            success=False,
            error="target_dir is required and cannot be empty",
        )

    os.makedirs(target_dir, exist_ok=True)

    _download_progress["status"] = "downloading"
    _download_progress["completed"] = 0
    _download_progress["total"] = 0
    _download_progress["current_song"] = ""

    try:
        resolved_url = _resolve_playlist_url(playlist_url)
        client = MusicClient(
            music_sources=["NeteaseMusicClient"],
            init_music_clients_cfg={
                "NeteaseMusicClient": {
                    "work_dir": target_dir,
                    "disable_print": True,
                }
            },
        )
        songs = client.parseplaylist(resolved_url)
    except Exception as e:
        _download_progress["status"] = "failed"
        return DownloadResponse(success=False, error=f"{type(e).__name__}: {e}")

    if body.song_identifiers is not None:
        id_set = set(body.song_identifiers)
        songs = [s for s in songs if str(s.identifier) in id_set]

    total = len(songs)
    _download_progress["total"] = total

    downloaded = 0
    skipped = 0
    failed = 0
    errors: PyList[DownloadError] = []

    for song in songs:
        _download_progress["current_song"] = song.song_name or ""

        if _file_exists_for_song(target_dir, song.identifier, song.ext):
            skipped += 1
            _download_progress["completed"] += 1
            continue

        try:
            success = _download_with_timeout(client, song, timeout=120)
            if success and _file_exists_for_song(target_dir, song.identifier, song.ext):
                downloaded += 1
            else:
                failed += 1
                errors.append(
                    DownloadError(
                        song=song.song_name or str(song.identifier),
                        error="download failed or file not found after download",
                    )
                )
        except Exception as e:
            failed += 1
            errors.append(
                DownloadError(
                    song=song.song_name or str(song.identifier),
                    error=f"{type(e).__name__}: {e}",
                )
            )

        _download_progress["completed"] += 1

    _download_progress["status"] = "completed" if failed == 0 else "failed"

    return DownloadResponse(
        success=True,
        data=DownloadData(
            total=total,
            downloaded=downloaded,
            skipped=skipped,
            failed=failed,
            errors=errors,
        ),
    )


@app.get("/download-status", response_model=DownloadStatusResponse)
def download_status() -> DownloadStatusResponse:
    return DownloadStatusResponse(**_download_progress)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=HOST, port=PORT)
