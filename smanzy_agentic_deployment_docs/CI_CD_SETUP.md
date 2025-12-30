# CI/CD Setup Guide

This document explains how to configure GitHub Actions for automated deployment and rollback.

---

## Overview

The CI/CD pipeline consists of two workflows:

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| **Deploy** | `.github/workflows/deploy.yml` | Push to `main` / Manual | Build and deploy to production |
| **Rollback** | `.github/workflows/rollback.yml` | Manual only | Rollback to a previous version |

---

## Prerequisites

1. GitHub repository with the project code
2. SSH access to the production server
3. SSH key pair for authentication

---

## Step 1: Generate SSH Key Pair

If you don't already have a dedicated deploy key, generate one:

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key -N ""
```

This creates:
- `~/.ssh/github_deploy_key` (private key)
- `~/.ssh/github_deploy_key.pub` (public key)

---

## Step 2: Add Public Key to Server

Add the public key to the server's authorized keys:

```bash
# Copy public key to server
ssh-copy-id -i ~/.ssh/github_deploy_key.pub ristepan@conta.sman.cloud

# Or manually append to authorized_keys
cat ~/.ssh/github_deploy_key.pub | ssh ristepan@conta.sman.cloud "cat >> ~/.ssh/authorized_keys"
```

Verify access:

```bash
ssh -i ~/.ssh/github_deploy_key ristepan@conta.sman.cloud "echo 'SSH access works!'"
```

---

## Step 3: Configure GitHub Secrets

Go to your GitHub repository:
1. Navigate to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add the following secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `SSH_PRIVATE_KEY` | Contents of `~/.ssh/github_deploy_key` | Private key for SSH authentication |
| `SSH_HOST` | `conta.sman.cloud` | Server hostname |
| `SSH_USER` | `ristepan` | SSH username |

### How to Get Private Key Content

```bash
cat ~/.ssh/github_deploy_key
```

Copy the entire output including:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

---

## Step 4: Create GitHub Environment (Optional but Recommended)

For additional security, create a production environment with protection rules:

1. Go to **Settings** → **Environments**
2. Click **New environment**
3. Name it `production`
4. Configure protection rules:
   - ✅ Required reviewers (optional)
   - ✅ Wait timer (optional, e.g., 5 minutes)
   - ✅ Deployment branches: `main` only

---

## Usage

### Automatic Deployment

Push to `main` branch triggers automatic deployment:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

The workflow will:
1. SSH into the server
2. Pull latest code
3. Run `deploy.sh`
4. Verify health checks

### Manual Deployment

1. Go to **Actions** tab in GitHub
2. Select **Deploy to Production**
3. Click **Run workflow**
4. Choose branch and click **Run workflow**

### Manual Rollback

1. Go to **Actions** tab in GitHub
2. Select **Rollback Production**
3. Click **Run workflow**
4. Enter the backup tag (e.g., `backup-20251230-030626`)
5. Click **Run workflow**

#### Finding Backup Tags

SSH into server and list available backups:

```bash
ssh ristepan@conta.sman.cloud
docker images | grep backup
```

Or check the deployment logs for the backup tag created during deployment.

---

## Workflow Details

### Deploy Workflow

```
┌─────────────────────┐
│   Push to main      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Checkout code     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Setup SSH         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   SSH to server     │
│   - git pull        │
│   - deploy.sh       │
│   - health-check.sh │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Report status     │
└─────────────────────┘
```

### Rollback Workflow

```
┌─────────────────────┐
│   Manual trigger    │
│   + backup tag      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Validate tag      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   SSH to server     │
│   - rollback.sh     │
│   - health-check.sh │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Report status     │
└─────────────────────┘
```

---

## Troubleshooting

### SSH Connection Failed

**Error:** `Permission denied (publickey)`

**Solution:**
1. Verify the private key is correctly set in GitHub secrets
2. Ensure the public key is in `~/.ssh/authorized_keys` on the server
3. Check key permissions on server: `chmod 600 ~/.ssh/authorized_keys`

### Host Key Verification Failed

**Error:** `Host key verification failed`

**Solution:**
The workflow automatically adds the host to known_hosts. If issues persist:
1. SSH into the server manually once to accept the host key
2. Or add the host key to the workflow

### Deployment Failed

**Check logs:**
1. Go to **Actions** tab
2. Click on the failed workflow run
3. Expand the failed step to see error details

**Common issues:**
- `.env` file missing on server
- Docker daemon not running
- Disk space full

### Rollback Failed

**Error:** `No such image: smanzy_backend:backup-XXXXXXXX-XXXXXX`

**Solution:**
The backup tag doesn't exist. List available backups:

```bash
ssh ristepan@conta.sman.cloud "docker images | grep backup"
```

---

## Security Best Practices

1. **Rotate SSH keys** periodically
2. **Use environment protection** rules for production
3. **Never commit secrets** to the repository
4. **Limit SSH key permissions** - use a dedicated key for deployments only
5. **Monitor workflow runs** for unexpected activity

---

## Quick Reference

### GitHub Secrets Required

```
SSH_PRIVATE_KEY = <contents of private key file>
SSH_HOST = conta.sman.cloud
SSH_USER = ristepan
```

### Server Paths

```
Project:  /home/ristepan/smanzari_site
Scripts:  /home/ristepan/smanzari_site/scripts/
Compose:  /home/ristepan/smanzari_site/docker-compose.prod.yml
```

### Useful Commands

```bash
# Check deployment status
./scripts/health-check.sh

# View container logs
docker compose -f docker-compose.prod.yml logs -f

# List backup images
docker images | grep backup

# Manual rollback
./scripts/rollback.sh backup-YYYYMMDD-HHMMSS
```
