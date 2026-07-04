# Kubernetes Enterprise Strategy

This document outlines the roadmap for transitioning PRD Senate from a single-node Docker Compose deployment to an enterprise-grade Kubernetes cluster.

## 1. Scaling Strategy
The PRD Senate architecture contains two primary bottlenecks:
1. **The Web Tier (Next.js)**: CPU-bound during request handling and UI rendering.
2. **The LLM Tier (Ollama)**: GPU-bound during inference and generation.

**Roadmap**:
- Deploy the `prd-senate-app` using a standard `Deployment` resource.
- Configure a **Horizontal Pod Autoscaler (HPA)** for the web tier targeting 70% CPU utilization.
- Do **not** deploy Ollama inside the primary cluster unless using specialized GPU NodePools (e.g., GKE with NVIDIA L4/A100s). For most enterprises, point `OLLAMA_BASE_URL` to an external inference cluster or managed LLM provider to isolate compute domains.

## 2. Secret Management
Currently, PRD Senate relies on local `.env` files. In Kubernetes:
- Integrate with **External Secrets Operator** to pull secrets from AWS Secrets Manager, HashiCorp Vault, or Azure Key Vault.
- Inject secrets like `DATABASE_URL` (future), `OLLAMA_BASE_URL` API keys, and `GF_SECURITY_ADMIN_PASSWORD` as native `Secret` resources mounted to the pod environment.

## 3. Persistent Volume Strategy
Telemetry and Knowledge retrieval are currently file-system based (`data/ai_corrections.jsonl`). 
- **Short Term**: Use a `StatefulSet` with `volumeClaimTemplates` to attach a persistent disk (e.g., EBS) to the PRD Senate pod, ensuring `data/` persists across pod restarts.
- **Long Term**: Migrate telemetry storage from local `jsonl` files to a distributed time-series database or Postgres instance. Transition knowledge retrieval documents to an S3-compatible blob storage. This allows the Next.js app to return to a completely stateless `Deployment`, enabling horizontal scaling to multiple replicas.

## 4. Observability & Telemetry
- Deploy **Prometheus Operator** and `ServiceMonitor` resources to automatically discover and scrape the `/api/metrics` endpoint of all PRD Senate pods.
- Connect Grafana to the centralized Prometheus cluster to aggregate `AI Correction Rate` metrics across all horizontally scaled pods.
