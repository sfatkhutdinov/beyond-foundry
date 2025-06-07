# Docker Environment Setup Guide

This guide helps you set up the FoundryVTT and D&D Beyond proxy environment securely.

## Prerequisites

1. **Docker and Docker Compose** installed
2. **FoundryVTT license** from [https://foundryvtt.com](https://foundryvtt.com)

## Setup Instructions

### 1. Configure Environment Variables

Copy the template environment file and configure your credentials:

```bash
cp .env.example .env
```

Edit the `.env` file with your FoundryVTT credentials:

```env
# FoundryVTT Configuration
# Get these from https://foundryvtt.com/me/
FOUNDRY_USERNAME=your_username_here
FOUNDRY_PASSWORD=your_password_here

# FoundryVTT Settings
FOUNDRY_PORT=30000
DDB_PROXY_PORT=3100
CONTAINER_PRESERVE_CONFIG=true
```

### 2. Set Up Docker Compose

If you don't have a `docker-compose.yml` file, copy from the template:

```bash
cp docker-compose.template.yml docker-compose.yml
```

### 3. Create Data Directory

```bash
mkdir -p data
```

### 4. Start the Services

```bash
docker-compose up -d
```

### 5. Access Your Services

- **FoundryVTT**: http://localhost:30000
- **D&D Beyond Proxy**: http://localhost:3100

## Security Notes

⚠️ **Important Security Information:**

- The `.env` file contains sensitive credentials and is ignored by git
- Never commit credentials to version control
- The `docker-compose.yml` file is also in `.gitignore` to prevent accidental commits
- Use the `docker-compose.template.yml` as a reference for setup

## Troubleshooting

### Services Won't Start

1. Check if ports are already in use:
   ```bash
   lsof -i :30000
   lsof -i :3100
   ```

2. View service logs:
   ```bash
   docker-compose logs foundry
   docker-compose logs ddb-proxy
   ```

### FoundryVTT Login Issues

1. Verify your credentials at https://foundryvtt.com/me/
2. Check that `FOUNDRY_USERNAME` and `FOUNDRY_PASSWORD` are correct in `.env`
3. Restart the foundry service:
   ```bash
   docker-compose restart foundry
   ```

### Data Persistence

The `./data` directory contains all your FoundryVTT data including:
- Worlds
- Systems
- Modules
- Assets

Make sure to back up this directory regularly.

## Service Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# Update images
docker-compose pull
docker-compose up -d
```

## Beyond Foundry Module Integration

Once FoundryVTT is running:

1. Access the setup screen at http://localhost:30000
2. Install the Beyond Foundry module
3. Configure the D&D Beyond integration using the proxy at http://localhost:3100

For detailed module setup instructions, see [INSTALLATION.md](../INSTALLATION.md).
