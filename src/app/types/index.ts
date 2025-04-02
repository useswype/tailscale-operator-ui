// app/types/index.ts
import { V1Ingress, V1IngressList } from '@kubernetes/client-node';

// Re-export Kubernetes types for convenience
export type TailscaleIngress = V1Ingress;
export type TailscaleIngressList = V1IngressList;

// Form input type for creating/updating ingress
export interface IngressFormInput {
  name: string;
  namespace: string;
  host: string;
  serviceName: string;
  servicePort: number;
  path?: string;
  pathType?: 'Exact' | 'Prefix' | 'ImplementationSpecific';
  tlsEnabled?: boolean;
  tlsSecretName?: string;
  tags?: string;
  proxyClass?: string;
}
