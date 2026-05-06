# musicdl-service

FastAPI microservice wrapping the [musicdl](https://github.com/CharlesPikachu/musicdl) library for parsing Netease Cloud Music playlists.

## Setup

```bash
cd musicdl-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Running

```bash
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 3002 --reload
```

Or use the provided startup script:

```bash
chmod +x start.sh
./start.sh
```

## API Endpoints

### `GET /health`

Returns service health status.

**Response:**
```json
{"status": "ok"}
```

### `POST /parse`

Parse a Netease Cloud Music playlist URL and return song metadata.

**Request:**
```json
{"url": "https://music.163.com/playlist?id=7583298906"}
```

**Response (success):**
```json
{
  "success": true,
  "data": [
    {
      "song_name": "Ocean in Motion",
      "singers": "Eldar Kedem",
      "album": "Nothing but the Beat",
      "duration_s": 194,
      "cover_url": "https://...",
      "identifier": "1811562299",
      "ext": "flac",
      "download_url": "https://..."
    }
  ]
}
```

**Response (error):**
```json
{"success": false, "error": "descriptive message"}
```

## Testing

```bash
cd musicdl-service
python -m pytest
```

## Notes

- The service gracefully degrades if `musicdl` is not installed (`/health` still works, `/parse` returns an error).
- `identifier` is returned as a string even though musicdl provides it as an integer.
- Parsing is synchronous and can be slow (~7 seconds per song).
