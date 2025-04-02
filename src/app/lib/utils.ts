import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { V1IngressStatus, V1Ingress } from '@kubernetes/client-node';
import { format } from 'date-fns';

/**
 * Combines class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format date strings for display using date-fns
 */
export function formatDate(dateString: string): string {
  return format(new Date(dateString), 'MMM d, yyyy HH:mm:ss');
}

/**
 * Get the Tailscale URL for an Ingress based on the hostname
 */
export function getTailscaleUrl(hostname: string): string {
  return `https://${hostname}`;
}

/**
 * Check if Ingress is ready based on its status
 */
export function getIngressStatus(
  status?: V1IngressStatus
): 'Ready' | 'Pending' | 'Error' | 'Unknown' {
  if (
    !status ||
    !status.loadBalancer ||
    !status.loadBalancer.ingress ||
    status.loadBalancer.ingress.length === 0
  ) {
    return 'Pending';
  }

  const hasIP = status.loadBalancer.ingress.some((ing) => !!ing.ip);
  const hasHostname = status.loadBalancer.ingress.some((ing) => !!ing.hostname);

  if (hasIP || hasHostname) {
    return 'Ready';
  }

  return 'Unknown';
}

/**
 * Extracts the first service and port from an ingress rule
 */
export function extractServiceInfo(ingress: V1Ingress): {
  serviceName: string;
  servicePort: number;
} {
  try {
    const rule = ingress.spec?.rules?.[0];
    const path = rule?.http?.paths?.[0];
    return {
      serviceName: path?.backend?.service?.name || '',
      servicePort: path?.backend?.service?.port?.number || 0,
    };
  } catch (error) {
    console.error('Error extracting service info:', error);
    return { serviceName: '', servicePort: 0 };
  }
}
