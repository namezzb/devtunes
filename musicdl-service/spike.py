"""
THROWAWAY SPIKE SCRIPT — musicdl library schema verification.

Tests parseplaylist() return schema and download() functionality.
This is NOT production code; it is for validation only.
"""
import json
import os
import shutil
import sys
import time
from pathlib import Path

WORK_DIR = "/tmp/musicdl-spike/"


def main():
    print("=" * 72)
    print("  MUSICDL SPIKE — Schema & Download Verification")
    print("=" * 72)

    # ---------------------------------------------------------------
    # 1) Verify musicdl is installed
    # ---------------------------------------------------------------
    try:
        import musicdl
    except ImportError:
        print("\n[FAIL] musicdl is not installed.")
        print("\n  To install:")
        print("    pip install musicdl")
        print("  or (macOS with Homebrew Python):")
        print("    pip3 install musicdl --break-system-packages")
        sys.exit(1)

    print(f"\n  musicdl version: {musicdl.__version__}")

    from musicdl.musicdl import MusicClient

    # ---------------------------------------------------------------
    # 2) Clean work directory
    # ---------------------------------------------------------------
    if os.path.isdir(WORK_DIR):
        shutil.rmtree(WORK_DIR)
    os.makedirs(WORK_DIR, exist_ok=True)
    print(f"  Work dir: {WORK_DIR}")

    # ---------------------------------------------------------------
    # 3) Instantiate client
    # ---------------------------------------------------------------
    print("\n" + "-" * 72)
    print("  STEP 1: Instantiating MusicClient")
    print("-" * 72)

    try:
        client = MusicClient(
            music_sources=["NeteaseMusicClient"],
            init_music_clients_cfg={
                "NeteaseMusicClient": {"work_dir": WORK_DIR}
            },
        )
        print("  [OK] MusicClient instantiated successfully")
    except Exception as e:
        print(f"  [FAIL] Could not instantiate MusicClient: {e}")
        sys.exit(1)

    # ---------------------------------------------------------------
    # 4) Parse a playlist
    # ---------------------------------------------------------------
    print("\n" + "-" * 72)
    print("  STEP 2: parseplaylist()")
    print("-" * 72)

    playlist_url = "https://music.163.com/#/playlist?id=7583298906"
    print(f"  URL: {playlist_url}")
    print(f"  Note: This is a small public Netease playlist.")

    parse_start = time.time()
    try:
        songs = client.parseplaylist(playlist_url)
        parse_elapsed = time.time() - parse_start
    except Exception as e:
        parse_elapsed = time.time() - parse_start
        print(f"  [FAIL] parseplaylist() raised an exception after {parse_elapsed:.2f}s:")
        print(f"    {type(e).__name__}: {e}")
        print("\n  Trying alternative URL format without hash...")
        try:
            playlist_url2 = "https://music.163.com/playlist?id=7583298906"
            parse_start = time.time()
            songs = client.parseplaylist(playlist_url2)
            parse_elapsed = time.time() - parse_start
        except Exception as e2:
            print(f"  [FAIL] Also failed: {type(e2).__name__}: {e2}")
            songs = []

    print(f"\n  parseplaylist() returned {len(songs)} song(s) in {parse_elapsed:.2f}s")

    if not songs:
        print("\n  [WARN] No songs returned. Checking if Netease API is accessible...")
        print("  This may be due to network restrictions or playlist requiring login.")
        print("  Continuing with structural checks only.")
        _report_schema([], parse_elapsed)
        _cleanup()
        return

    # ---------------------------------------------------------------
    # 5) Print full SongInfo for first 3 tracks
    # ---------------------------------------------------------------
    print("\n" + "-" * 72)
    print("  STEP 3: Full SongInfo schema — first 3 tracks")
    print("-" * 72)

    _print_song_info(songs, count=3)

    # ---------------------------------------------------------------
    # 6) Schema report from ALL returned songs
    # ---------------------------------------------------------------
    print("\n" + "-" * 72)
    print("  SCHEMA REPORT (across all returned songs)")
    print("-" * 72)

    _report_schema(songs, parse_elapsed)

    # ---------------------------------------------------------------
    # 7) Download test — single track
    # ---------------------------------------------------------------
    print("\n" + "-" * 72)
    print("  STEP 4: download() — single track")
    print("-" * 72)

    first = songs[0]
    print(f"  Downloading: {first.song_name or '<no name>'} — {first.singers or '<no artist>'}")
    print(f"  Source: {first.source}")
    print(f"  Has download_url: {'YES' if first.download_url else 'NO'}")
    print(f"  Has valid_download_url: {'YES' if first.with_valid_download_url else 'NO'}")

    dl_start = time.time()
    try:
        downloaded = client.download([first])
        dl_elapsed = time.time() - dl_start
        print(f"\n  download() completed in {dl_elapsed:.2f}s")
        print(f"  Downloaded {len(downloaded)} song(s)")
    except Exception as e:
        dl_elapsed = time.time() - dl_start
        print(f"\n  [FAIL] download() raised an exception after {dl_elapsed:.2f}s:")
        print(f"    {type(e).__name__}: {e}")
        downloaded = []

    # ---------------------------------------------------------------
    # 8) Check downloaded file
    # ---------------------------------------------------------------
    print("\n" + "-" * 72)
    print("  STEP 5: Verifying downloaded file")
    print("-" * 72)

    _check_downloaded_files(downloaded, songs)

    # ---------------------------------------------------------------
    # 9) Check download directory
    # ---------------------------------------------------------------
    print("\n" + "-" * 72)
    print("  DOWNLOAD DIRECTORY CONTENTS")
    print("-" * 72)

    if os.path.isdir(WORK_DIR):
        files = sorted(os.listdir(WORK_DIR))
        if files:
            for f in files:
                fpath = os.path.join(WORK_DIR, f)
                size = os.path.getsize(fpath)
                print(f"    {f}  ({size:,} bytes)")
        else:
            print("    (empty directory)")
    else:
        print(f"    (directory does not exist: {WORK_DIR})")

    # ---------------------------------------------------------------
    # 10) Cleanup
    # ---------------------------------------------------------------
    _cleanup()
    print("\n" + "=" * 72)
    print("  SPIKE COMPLETE")
    print("=" * 72)


def _print_song_info(songs, count: int):
    """Print structured SongInfo fields for the first N tracks."""
    for i, song in enumerate(songs[:count]):
        print(f"\n  --- Track {i + 1} ---")
        d = song.todict() if hasattr(song, "todict") else song.__dict__
        # Print selected important fields in a structured way
        _print_field("song_name", d.get("song_name"))
        _print_field("singers", d.get("singers"))
        _print_field("album", d.get("album"))
        _print_field("source", d.get("source"))
        _print_field("identifier", d.get("identifier"))
        _print_field("ext", d.get("ext"))
        _print_field("duration", d.get("duration"))
        _print_field("duration_s", d.get("duration_s"))
        _print_field("bitrate", d.get("bitrate"))
        _print_field("codec", d.get("codec"))
        _print_field("samplerate", d.get("samplerate"))
        _print_field("channels", d.get("channels"))
        _print_field("file_size", d.get("file_size"))
        _print_field("file_size_bytes", d.get("file_size_bytes"))
        _print_field("cover_url", d.get("cover_url"))
        _print_field("download_url", d.get("download_url"))
        _print_field("download_url_status", d.get("download_url_status"))
        _print_field("lyric", d.get("lyric"))
        _print_field("work_dir", d.get("work_dir"))
        _print_field("save_path", d.get("save_path") or (song.save_path if hasattr(song, "save_path") else None))
        _print_field("with_valid_download_url", song.with_valid_download_url if hasattr(song, "with_valid_download_url") else None)
        _print_field("root_source", d.get("root_source"))


def _print_field(name, value):
    """Helper to pretty-print a field."""
    if value is None:
        print(f"    {name:30s} = None")
    elif isinstance(value, str) and len(value) > 80:
        print(f"    {name:30s} = {value[:80]}...")
    elif isinstance(value, dict):
        print(f"    {name:30s} = (dict: {json.dumps(value, ensure_ascii=False)[:100]})")
    else:
        print(f"    {name:30s} = {value!r}")


def _report_schema(songs, parse_elapsed: float):
    """Aggregate schema report: which fields are populated vs None."""
    if not songs:
        print("  (No songs returned — schema report unavailable)")
        return

    field_counts: dict[str, int] = {}
    field_populated: dict[str, int] = {}
    field_values: dict[str, set] = {}

    for song in songs:
        d = song.todict() if hasattr(song, "todict") else song.__dict__
        for key, val in d.items():
            field_counts[key] = field_counts.get(key, 0) + 1
            if val is not None:
                field_populated[key] = field_populated.get(key, 0) + 1
            if key not in field_values:
                field_values[key] = set()
            if isinstance(val, (str, int, float, bool)):
                field_values[key].add(repr(val)[:60])

    print(f"\n  Total songs returned: {len(songs)}")
    print(f"  Parse time: {parse_elapsed:.2f}s")
    print(f"  Parse time per song: {parse_elapsed / max(len(songs), 1) * 1000:.1f}ms")
    print(f"\n  {'Field':30s} {'Populated/Total':>16s}  {'Sample values':>20s}")
    print(f"  {'-' * 30} {'-' * 16}  {'-' * 20}")
    all_fields = sorted(field_counts.keys())
    for f in all_fields:
        total = field_counts[f]
        populated = field_populated.get(f, 0)
        pct = populated / total * 100 if total else 0
        sample = list(field_values.get(f, set()))[:2] if populated else ["N/A"]
        sample_str = ", ".join(str(s) for s in sample)
        print(f"  {f:30s} {populated:>4d}/{total:<4d} ({pct:>5.1f}%)  {sample_str[:40]}")

    # Summary
    always_present = [f for f in all_fields if field_populated.get(f, 0) == field_counts[f]]
    never_present = [f for f in all_fields if field_populated.get(f, 0) == 0]
    print(f"\n  Fields ALWAYS populated ({len(always_present)}):")
    print(f"    {', '.join(always_present)}")
    print(f"\n  Fields NEVER populated ({len(never_present)}):")
    print(f"    {', '.join(never_present)}")


def _check_downloaded_files(downloaded, songs):
    """Verify files exist in the work directory."""
    if not downloaded:
        print("  No songs were downloaded to check.")
        # Still check the work dir
        if os.path.isdir(WORK_DIR):
            files = os.listdir(WORK_DIR)
            if files:
                print(f"  However, files exist in {WORK_DIR}:")
                for f in files:
                    print(f"    - {f}")
            else:
                print(f"  No files in {WORK_DIR}.")
        return

    for i, song in enumerate(downloaded):
        name = song.song_name or "unknown"
        sp = song.save_path if hasattr(song, "save_path") else None
        exists = os.path.isfile(sp) if sp else False
        if exists:
            size = os.path.getsize(sp)
            print(f"  [{i + 1}] {name}")
            print(f"       save_path: {sp}")
            print(f"       exists: YES ({size:,} bytes)")
        else:
            print(f"  [{i + 1}] {name}")
            print(f"       save_path: {sp}")
            print(f"       exists: NO (file not found at expected path)")


def _cleanup():
    """Remove the temporary work directory."""
    if os.path.isdir(WORK_DIR):
        shutil.rmtree(WORK_DIR)
        print(f"\n  Cleaned up: {WORK_DIR}")


if __name__ == "__main__":
    main()
