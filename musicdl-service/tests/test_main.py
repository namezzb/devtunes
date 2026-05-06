import sys
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, "/Users/zhangzibo/PycharmProjects/devtunes/musicdl-service")


@pytest.fixture
def client_with_musicdl():
    with patch.dict("sys.modules", {"musicdl": MagicMock(), "musicdl.musicdl": MagicMock()}):
        mock_music_client_class = MagicMock()
        mock_music_client_instance = MagicMock()
        mock_music_client_class.return_value = mock_music_client_instance

        import importlib
        import main as main_module

        main_module.MusicClient = mock_music_client_class
        main_module.musicdl_available = True

        importlib.reload(main_module)
        main_module.MusicClient = mock_music_client_class
        main_module.musicdl_available = True

        client = TestClient(main_module.app)
        yield client, mock_music_client_instance

        importlib.reload(main_module)


@pytest.fixture
def client_without_musicdl():
    with patch.dict("sys.modules", {"musicdl": None, "musicdl.musicdl": None}):
        import importlib
        import main as main_module

        main_module.MusicClient = None
        main_module.musicdl_available = False

        client = TestClient(main_module.app)
        yield client

        importlib.reload(main_module)


def test_health_returns_200_and_ok():
    import importlib
    import main as main_module

    importlib.reload(main_module)
    client = TestClient(main_module.app)

    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_parse_with_mocked_musicclient_returns_song_list(client_with_musicdl):
    client, mock_instance = client_with_musicdl

    song1 = SimpleNamespace(
        song_name="Test Song",
        singers="Test Artist",
        album="Test Album",
        duration_s=180,
        cover_url="https://example.com/cover.jpg",
        identifier=12345,
        ext="flac",
        download_url="https://example.com/audio.flac",
    )
    song2 = SimpleNamespace(
        song_name="Another Song",
        singers="Another Artist",
        album="Another Album",
        duration_s=240,
        cover_url="https://example.com/cover2.jpg",
        identifier=67890,
        ext="mp3",
        download_url="https://example.com/audio.mp3",
    )
    mock_instance.parseplaylist.return_value = [song1, song2]

    response = client.post("/parse", json={"url": "https://music.163.com/playlist?id=123"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert len(payload["data"]) == 2

    first = payload["data"][0]
    assert first["song_name"] == "Test Song"
    assert first["singers"] == "Test Artist"
    assert first["album"] == "Test Album"
    assert first["duration_s"] == 180
    assert first["cover_url"] == "https://example.com/cover.jpg"
    assert first["identifier"] == "12345"
    assert first["ext"] == "flac"
    assert first["download_url"] == "https://example.com/audio.flac"


def test_parse_with_empty_url_returns_error(client_with_musicdl):
    client, _ = client_with_musicdl

    response = client.post("/parse", json={"url": ""})

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is False
    assert "url is required" in payload["error"]


def test_parse_when_musicdl_not_available_returns_error():
    import main as main_module

    original_musicclient = main_module.MusicClient
    original_available = main_module.musicdl_available

    try:
        main_module.MusicClient = None
        main_module.musicdl_available = False
        client = TestClient(main_module.app)

        response = client.post("/parse", json={"url": "https://music.163.com/playlist?id=123"})
        assert response.status_code == 200
        payload = response.json()
        assert payload["success"] is False
        assert "musicdl library is not installed" in payload["error"]
    finally:
        main_module.MusicClient = original_musicclient
        main_module.musicdl_available = original_available


def test_health_works_when_musicdl_not_available():
    import main as main_module

    original_musicclient = main_module.MusicClient
    original_available = main_module.musicdl_available

    try:
        main_module.MusicClient = None
        main_module.musicdl_available = False
        client = TestClient(main_module.app)

        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
    finally:
        main_module.MusicClient = original_musicclient
        main_module.musicdl_available = original_available


def test_download_endpoint_success(client_with_musicdl):
    client, mock_instance = client_with_musicdl

    song1 = SimpleNamespace(
        song_name="Test Song",
        singers="Artist",
        album="Album",
        duration_s=180,
        cover_url="https://example.com/cover.jpg",
        identifier=12345,
        ext="flac",
        download_url="https://example.com/audio.flac",
    )

    mock_instance.parseplaylist.return_value = [song1]

    def download_side_effect(songs):
        for s in songs:
            s.save_path = "/tmp/test/Test Song - 12345.flac"

    mock_instance.download.side_effect = download_side_effect

    with patch("os.path.exists", return_value=True):
        response = client.post("/download", json={
            "playlist_url": "https://music.163.com/playlist?id=123",
            "target_dir": "/tmp/test",
        })

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["total"] == 1
    assert payload["data"]["downloaded"] == 1
    assert payload["data"]["skipped"] == 0
    assert payload["data"]["failed"] == 0
    assert len(payload["data"]["errors"]) == 0


def test_download_with_identifier_filter(client_with_musicdl):
    client, mock_instance = client_with_musicdl

    song1 = SimpleNamespace(
        song_name="Song One", singers="Artist", album="Album",
        duration_s=180, cover_url="https://example.com/cover.jpg",
        identifier=11111, ext="flac", download_url="https://example.com/audio.flac",
    )
    song2 = SimpleNamespace(
        song_name="Song Two", singers="Artist", album="Album",
        duration_s=240, cover_url="https://example.com/cover2.jpg",
        identifier=22222, ext="mp3", download_url="https://example.com/audio.mp3",
    )

    mock_instance.parseplaylist.return_value = [song1, song2]

    def download_side_effect(songs):
        for s in songs:
            s.save_path = f"/tmp/test/{s.song_name} - {s.identifier}.{s.ext}"

    mock_instance.download.side_effect = download_side_effect

    with patch("os.path.exists", return_value=True):
        response = client.post("/download", json={
            "playlist_url": "https://music.163.com/playlist?id=123",
            "target_dir": "/tmp/test",
            "song_identifiers": ["22222"],
        })

    assert response.status_code == 200
    payload = response.json()
    assert payload["data"]["total"] == 1
    assert payload["data"]["downloaded"] == 1


def test_download_smart_skip_existing_files(client_with_musicdl):
    client, mock_instance = client_with_musicdl

    song1 = SimpleNamespace(
        song_name="Song One", singers="Artist", album="Album",
        duration_s=180, cover_url="https://example.com/cover.jpg",
        identifier=11111, ext="flac", download_url="https://example.com/audio.flac",
    )

    mock_instance.parseplaylist.return_value = [song1]

    with patch("os.walk") as mock_walk:
        mock_walk.return_value = [("/tmp/test", [], ["Song One - 11111.flac"])]
        response = client.post("/download", json={
            "playlist_url": "https://music.163.com/playlist?id=123",
            "target_dir": "/tmp/test",
        })

    assert response.status_code == 200
    payload = response.json()
    assert payload["data"]["skipped"] == 1
    assert payload["data"]["downloaded"] == 0


def test_download_status_idle():
    import main as main_module
    main_module._download_progress["status"] = "idle"
    main_module._download_progress["completed"] = 0
    main_module._download_progress["total"] = 0
    main_module._download_progress["current_song"] = ""

    client = TestClient(main_module.app)
    response = client.get("/download-status")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "idle"
    assert payload["completed"] == 0


def test_download_status_after_download(client_with_musicdl):
    client, mock_instance = client_with_musicdl

    song1 = SimpleNamespace(
        song_name="After Download", singers="Artist", album="Album",
        duration_s=180, cover_url="https://example.com/cover.jpg",
        identifier=99999, ext="flac", download_url="https://example.com/audio.flac",
    )

    mock_instance.parseplaylist.return_value = [song1]

    def download_side_effect(songs):
        for s in songs:
            s.save_path = "/tmp/test/After Download - 99999.flac"

    mock_instance.download.side_effect = download_side_effect

    with patch("os.path.exists", return_value=True):
        response = client.post("/download", json={
            "playlist_url": "https://music.163.com/playlist?id=123",
            "target_dir": "/tmp/test",
        })

    assert response.status_code == 200

    status_response = client.get("/download-status")
    status_payload = status_response.json()
    assert status_payload["status"] == "completed"
    assert status_payload["completed"] == 1
    assert status_payload["total"] == 1


def test_download_when_musicdl_not_available():
    import main as main_module
    original_musicclient = main_module.MusicClient
    original_available = main_module.musicdl_available

    try:
        main_module.MusicClient = None
        main_module.musicdl_available = False
        client = TestClient(main_module.app)

        response = client.post("/download", json={
            "playlist_url": "https://music.163.com/playlist?id=123",
            "target_dir": "/tmp/test",
        })
        assert response.status_code == 200
        payload = response.json()
        assert payload["success"] is False
        assert "musicdl library is not installed" in payload["error"]
    finally:
        main_module.MusicClient = original_musicclient
        main_module.musicdl_available = original_available


def test_download_with_empty_url(client_with_musicdl):
    client, _ = client_with_musicdl
    response = client.post("/download", json={
        "playlist_url": "   ",
        "target_dir": "/tmp/test",
    })
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is False
    assert "playlist_url is required" in payload["error"]


def test_download_with_empty_target_dir(client_with_musicdl):
    client, _ = client_with_musicdl
    response = client.post("/download", json={
        "playlist_url": "https://music.163.com/playlist?id=123",
        "target_dir": "   ",
    })
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is False
    assert "target_dir is required" in payload["error"]
