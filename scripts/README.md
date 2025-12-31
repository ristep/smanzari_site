# Scripts Documentation

This directory contains utility scripts for managing the smanzari_site Docker deployment.

## Overview

| Script | Description |
|--------|-------------|
| `deploy.sh` | Main deployment script |
| `health-check.sh` | Health check utilities |
| `rollback.sh` | Rollback to previous deployment |
| `restart-containers.sh` | Restart/rebuild containers (CI/CD optimized) |
| `start-pgadmin.sh` | Manual pgAdmin management |

---

## restart-containers.sh

A comprehensive script for restarting/rebuilding Docker containers, optimized for GitHub Actions CI/CD pipelines.

### Features

- Automatic CI environment detection (disables colors, uses GitHub Actions logging)
- Excludes pgAdmin by default (use `--all` to include)
- Skips health checks for frontend (non-critical)
- Supports multiple actions: restart, rebuild, stop, start, down, up
- Pruning of unused Docker resources
- Dry-run mode for testing

### Usage

```bash
./scripts/restart-containers.sh [OPTIONS] [SERVICES...]
```

### Options

| Option | Description |
|--------|-------------|
| `-a, --action ACTION` | Action to perform: `restart`, `rebuild`, `stop`, `start`, `down`, `up` (default: `restart`) |
| `-b, --build` | Force rebuild of images before starting |
| `-f, --file FILE` | Specify docker-compose file (default: `docker-compose.yml`) |
| `-d, --dir DIR` | Project directory containing docker-compose.yml |
| `-p, --pull` | Pull latest images before starting |
| `-r, --force-recreate` | Force recreation of containers |
| `-t, --timeout SECONDS` | Timeout for container operations (default: 60) |
| `--all` | Include all services (including pgadmin) |
| `--prune` | Prune unused images/volumes after operation |
| `--dry-run` | Show commands without executing |
| `-v, --verbose` | Enable verbose output |
| `-h, --help` | Show help message |

### Actions

| Action | Description |
|--------|-------------|
| `restart` | Stop and start containers (default) |
| `rebuild` | Rebuild images from scratch and recreate containers |
| `stop` | Stop running containers |
| `start` | Start stopped containers |
| `down` | Stop and remove containers, networks |
| `up` | Create and start containers |

### Examples

```bash
# Restart all containers (excluding pgadmin)
./scripts/restart-containers.sh

# Rebuild only backend and frontend
./scripts/restart-containers.sh -a rebuild backend frontend

# Pull latest images and restart with force recreate
./scripts/restart-containers.sh -p -r

# Full rebuild with pruning (useful for CI)
./scripts/restart-containers.sh -a rebuild -b -p --prune

# Include all services (including pgadmin)
./scripts/restart-containers.sh --all

# Dry run to see what would be executed
./scripts/restart-containers.sh -a rebuild --dry-run -v
```

### GitHub Actions Integration

The script automatically detects GitHub Actions environment and:
- Disables colored output for cleaner logs
- Uses `::group::` for log grouping
- Sets outputs via `$GITHUB_OUTPUT`:
  - `healthy`: "true" or "false"
  - `duration`: operation duration in seconds
  - `action`: the action that was performed
- Uses `::warning::` and `::error::` annotations

#### Example Workflow

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Rebuild containers
        id: containers
        run: ./scripts/restart-containers.sh -a rebuild -b --prune
        
      - name: Check health status
        if: steps.containers.outputs.healthy == 'false'
        run: |
          echo "Some containers are unhealthy!"
          exit 1
          
      - name: Report duration
        run: echo "Deployment took ${{ steps.containers.outputs.duration }}s"
```

---

## start-pgadmin.sh

Script for manually starting/stopping the pgAdmin container. pgAdmin is excluded from automated deployments to save resources.

### Usage

```bash
./scripts/start-pgadmin.sh [OPTIONS] [ACTION]
```

### Actions

| Action | Description |
|--------|-------------|
| `start` | Start pgAdmin container (default) |
| `stop` | Stop pgAdmin container |
| `restart` | Restart pgAdmin container |
| `status` | Show pgAdmin container status |
| `logs` | Show pgAdmin container logs (follow mode) |

### Options

| Option | Description |
|--------|-------------|
| `-f, --file FILE` | Specify docker-compose file (default: `docker-compose.yml`) |
| `-d, --dir DIR` | Project directory containing docker-compose.yml |
| `-h, --help` | Show help message |

### Examples

```bash
# Start pgAdmin
./scripts/start-pgadmin.sh

# Stop pgAdmin when done
./scripts/start-pgadmin.sh stop

# Check status
./scripts/start-pgadmin.sh status

# View logs
./scripts/start-pgadmin.sh logs

# Restart pgAdmin
./scripts/start-pgadmin.sh restart
```

### Access

Once started, pgAdmin is available at: **http://localhost:5050**

Use the credentials defined in your `.env` file:
- `PGADMIN_EMAIL`
- `PGADMIN_PASSWORD`

---

## Health Checks

### Checked Services
- `postgres` - Database health via `pg_isready`
- `backend` - HTTP health endpoint at `/health`

### Skipped Services
- `frontend` - Non-critical, basic nginx serving
- `pgadmin` - Optional service, started manually

---

## Environment Variables

These scripts respect the following environment variables:

| Variable | Description |
|----------|-------------|
| `CI` | Set to "true" in CI environments |
| `GITHUB_ACTIONS` | Automatically set by GitHub Actions |
| `GITHUB_OUTPUT` | GitHub Actions output file |
| `PRUNE_VOLUMES` | Set to "true" to also prune volumes during cleanup |

---

## Troubleshooting

### Containers not starting
```bash
# Check logs for specific service
docker compose logs backend

# Rebuild with verbose output
./scripts/restart-containers.sh -a rebuild -v
```

### Health check failing
```bash
# Increase timeout
./scripts/restart-containers.sh -t 120

# Check container health manually
docker inspect --format='{{.State.Health.Status}}' smanzy_backend
```

### Disk space issues
```bash
# Prune everything including volumes (careful!)
PRUNE_VOLUMES=true ./scripts/restart-containers.sh -a rebuild --prune
```
