# Deployment Setup

PRD Senate is fully dockerized for ease of deployment.

## Prerequisites
- Docker
- Docker Compose

## Modes of Operation

### 1. External Ollama (Default)
If you already run Ollama on your host machine natively, you don't need to run it inside Docker.

```bash
# Start PRD Senate, Prometheus, and Grafana
docker compose up -d
```

Ensure your `OLLAMA_BASE_URL` is set in the `.env` file (it defaults to `http://host.docker.internal:11434` which points to your host machine's Ollama instance).

### 2. Internal Ollama (GPU Passthrough Required)
If you want to bundle Ollama completely inside the Docker Compose network:

```bash
docker compose --profile docker-ollama up -d
```

*Note: This configuration expects Docker to be configured for NVIDIA GPU passthrough for performance. If you lack a GPU, generation latency will be extremely high.*

## Observability
Once running, the stack provides:
- **PRD Senate App**: `http://localhost:3000`
- **AI Reliability Dashboard**: `http://localhost:3000/reliability`
- **Prometheus**: `http://localhost:9090`
- **Grafana**: `http://localhost:3001` (admin/admin)
