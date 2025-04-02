import { V1Ingress } from '@kubernetes/client-node';
import yaml from 'js-yaml';

/**
 * Convert a Kubernetes object to a clean YAML representation
 * by removing unnecessary fields and status information
 */
export function sanitizeForExport(obj: unknown): unknown {
  // Make a deep copy to avoid modifying the original
  const sanitized = JSON.parse(JSON.stringify(obj));

  // Remove auto-generated and irrelevant fields
  if (sanitized.metadata) {
    delete sanitized.metadata.creationTimestamp;
    delete sanitized.metadata.generation;
    delete sanitized.metadata.resourceVersion;
    delete sanitized.metadata.selfLink;
    delete sanitized.metadata.uid;
    delete sanitized.metadata.managedFields;

    // Remove empty annotations
    if (
      sanitized.metadata.annotations &&
      Object.keys(sanitized.metadata.annotations).length === 0
    ) {
      delete sanitized.metadata.annotations;
    }
  }

  // Remove status field
  delete sanitized.status;

  return sanitized;
}

/**
 * Converts an array of Ingress resources to a combined YAML document
 */
export function generateIngressYaml(ingresses: V1Ingress[]): string {
  const sanitizedIngresses = ingresses.map((ingress) =>
    sanitizeForExport(ingress)
  );

  // Convert each ingress to YAML and join with document separator
  return sanitizedIngresses
    .map((ingress) => yaml.dump(ingress, { lineWidth: 100 }))
    .join('---\n');
}

/**
 * Create and trigger a download of a file
 */
export function downloadYaml(content: string, filename: string): void {
  // Create a blob with the content
  const blob = new Blob([content], { type: 'text/yaml' });
  const url = URL.createObjectURL(blob);

  // Create a temporary link element and trigger the download
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate and download a YAML file containing all ingress resources
 */
export function exportIngressesToYaml(ingresses: V1Ingress[]): void {
  const yaml = generateIngressYaml(ingresses);
  const filename = `tailscale-ingresses-${new Date().toISOString().split('T')[0]}.yaml`;
  downloadYaml(yaml, filename);
}
