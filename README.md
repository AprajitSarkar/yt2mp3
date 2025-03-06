# YouTube to MP3 Converter API

A Node.js API service that converts YouTube videos to MP3 format with caching functionality.

## Features

- YouTube URL validation
- Video information retrieval
- MP3 conversion and download
- Automatic cache cleanup
- CORS enabled

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
node app.js
```

The server will run on port 3000 by default (configurable via PORT environment variable).

## API Endpoints

### 1. Validate YouTube URL

**Endpoint:** `POST /api/validate`

**Request Body:**
```json
{
    "url": "https://www.youtube.com/watch?v=example"
}
```

**Response:**
```json
{
    "valid": true
}
```

### 2. Get Video Information

**Endpoint:** `POST /api/info`

**Request Body:**
```json
{
    "url": "https://www.youtube.com/watch?v=example"
}
```

**Response:**
```json
{
    "title": "Video Title",
    "duration": 180,
    "author": "Channel Name",
    "thumbnail": "thumbnail_url"
}
```

### 3. Convert and Download MP3

**Endpoint:** `POST /api/convert`

**Request Body:**
```json
{
    "url": "https://www.youtube.com/watch?v=example"
}
```

**Response:**
File download stream (MP3 file)

## Error Handling

All endpoints return appropriate HTTP status codes:

- 400: Bad Request (missing or invalid URL)
- 500: Server Error (conversion/download failure)

Error responses include a JSON object with an error message:
```json
{
    "error": "Error description"
}
```

## Caching

- Converted MP3 files are temporarily stored in a `cache` directory
- Files older than 1 hour are automatically cleaned up
- Cache cleanup runs every hour
- Files are deleted after successful download

## Technical Details

- Uses @distube/ytdl-core for YouTube video processing
- FFmpeg for audio conversion
- Express.js for API server
- 128kbps MP3 output quality
- Handles client disconnection gracefully

## Security Considerations

- Input validation for YouTube URLs
- Automatic file cleanup
- CORS enabled for cross-origin requests
- Error handling for all operations