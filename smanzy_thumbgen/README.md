# smanzy_thumbgen

Smanzy Thumbnail Generator — a small, efficient background worker written in Go that watches an `uploads/` directory, generates optimized thumbnails for images, videos, and HEIC/HEIF files, and performs garbage collection of orphaned thumbnails. It can run locally, inside Docker, or as part of a larger system.

## Overview

The service watches the configured `./uploads` directory. When new media is added it automatically generates thumbnails in predefined sizes and cleans up orphaned thumbnails. It can also be invoked in one-shot mode to regenerate all thumbnails.

## Tech Stack

- Go (module target: go 1.23)
- `ffmpeg` (for video and HEIC frame extraction)
- `github.com/disintegration/imaging` (image processing)
- `github.com/fsnotify/fsnotify` (file system notifications)
- Docker (Alpine-based image for production)

## Features

- **Real-time File Watching**: Utilizes `fsnotify` to detect file system events immediately.
- **Filesystem-based Triggers**: Control the service by "touching" special files in the upload directory.
- **Garbage Collection**: Automatically purges orphaned thumbnails on startup and via triggers.
- **Docker Ready**: Includes a lightweight Alpine-based Dockerfile with `ffmpeg`.

### Supported Formats

- **Images**: JPG, JPEG, PNG, GIF, BMP
- **Videos**: MP4, MOV, AVI, MKV, WEBM (Extracts a frame at 00:00:01)
- **HEIC**: Full support for HEIC/HEIF files (via ffmpeg)

### Output Sizes

Thumbnails are generated in the following subdirectories within `uploads`:
- `320x200/`: Small thumbnails
- `800x600/`: Medium thumbnails

## Usage

### Running with Docker (Recommended)

The service ships a lightweight Alpine-based image that includes `ffmpeg`. Since this is a background file-watching worker, mount your host `uploads` directory to `/app/uploads` to persist media and thumbnails.

You can run the thumbnailer directly with Docker:

```bash
# Build the image
docker build -t smanzy_thumbgen .

# Run in the foreground (useful for debugging)
docker run --rm -it -v $(pwd)/uploads:/app/uploads smanzy_thumbgen

# Or run detached (auto-restart on failure)
docker run -d --restart unless-stopped -v $(pwd)/uploads:/app/uploads --name smanzy_thumbgen smanzy_thumbgen
```

Alternatively, the repository includes a top-level `docker-compose.yml` which already defines a `thumbnailer` service for you. From the repository root you can bring up just that service:

```bash
# Docker Compose v2 (recommended)
docker compose up -d thumbnailer

# or with classic docker-compose
docker-compose up -d thumbnailer
```

The `thumbnailer` service defined in `docker-compose.yml` runs in persistent watcher mode, includes a healthcheck, and is configured with `restart: unless-stopped`. Check logs with:

```bash
docker logs -f smanzy_thumbnailer
```

Note: No ports are exposed — this is not an HTTP service.

### Running Locally

**Prerequisites:**
- Go 1.23 or higher (declared in `go.mod`)
- `ffmpeg` installed and available in your system PATH

Quick start (development):
```bash
# Fetch dependencies
go mod download

# Run the service (watches ./uploads)
go run main.go
```

Build a statically linked binary (Linux):
```bash
CGO_ENABLED=0 GOOS=linux go build -o thumbgen .
./thumbgen
```

Regenerate thumbnails for all files and exit:
```bash
./thumbgen --regenerate
# or
go run main.go --regenerate
```

Note: The service will create required subdirectories under `./uploads` (e.g. `320x200`, `800x600`).

## Configuration & Control

### Command Line Flags

| Flag | Description |
|------|-------------|
| `--regenerate` | Scans the `uploads` folder, regenerates thumbnails for ALL files, and then exits. |

Example:
```bash
go run main.go --regenerate
```

### Triggers (Runtime Control)

You can control the running service by creating empty files in the `./uploads` directory. The service detects these files, performs the action, and then deletes the trigger file.

- **Force Regeneration**:
  ```bash
  touch uploads/.trigger_regenerate
  ```
  *Effect: Re-processes every file in the uploads directory.*

- **Force Garbage Collection**:
  ```bash
  touch uploads/.trigger_gc
  ```
  *Effect: Scans for and deletes thumbnails that no longer have a corresponding source file.*

## Development

### Project Structure

- `main.go` — Application entry point and core logic (watcher, processing, garbage collector).
- `Dockerfile` — Multi-stage build (Go builder -> Alpine runner with `ffmpeg`).
- `go.mod` / `go.sum` — Go module and dependency definitions.
- `uploads/` — Source directory for media and destination for generated thumbnails (created automatically at runtime).
- `README.md` — Project documentation.

### Dependencies

- `github.com/disintegration/imaging` — High-quality image processing (resize & encode) used to create thumbnails.
- `github.com/fsnotify/fsnotify` — Cross-platform file system notifications (watches the `uploads` directory).
- `ffmpeg` (external binary) — Required for video and HEIC/HEIF processing (frame extraction). The provided Docker image includes `ffmpeg`.

Note: There are no automated unit tests configured in this repository at the moment.
