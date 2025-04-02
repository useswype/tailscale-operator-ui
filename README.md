# Tailscale Ingress Visualizer

> [!WARNING]
> This is solving a very specific use-case for Swypex and may not be suitable for
> all cases, especially for a production deployment. Use at your own risk.


Web UI for managing Tailscale Ingress resources in Kubernetes.

## Features

- List, create, edit, and delete Tailscale Ingress resources
- Network visualization of Ingress-Service-Host relationships
- Export all resources as a YAML file
- Label management with tags and proxy-class

## Quick Start

### Local Development

```bash
# Clone and install
git clone https://github.com/yourusername/tailscale-ingress-visualizer.git
cd tailscale-ingress-visualizer
npm install

# Run development server
npm run dev
```

### Kubernetes Deployment

```bash
# Build
docker build -t tailscale-ingress-visualizer:latest .

# Deploy
kubectl apply -f kubernetes/deployment.yaml

# Development with live updates
skaffold dev
```

## Tech Stack

- Next.js 15 + React 19 + TypeScript
- Kubernetes JavaScript client
- D3.js for visualization
- Tailwind CSS for styling
- SWR for data fetching

## Requirements

- Node.js 22+ (development)
- Kubernetes with Tailscale operator
- RBAC permissions for Ingress resources

## Configuration

The app uses the standard Kubernetes client configuration:
- In-cluster config when deployed in Kubernetes
- `~/.kube/config` when running locally

## Security Notes

- No authentication mechanism included - secure via network policies or ingress controllers
- RBAC is configured with least privilege

## License

MIT