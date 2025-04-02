import * as k8s from '@kubernetes/client-node';

// Initialize the Kubernetes client
export function getKubernetesClient() {
  const kc = new k8s.KubeConfig();

  try {
    // Try to load from default location
    kc.loadFromDefault();
  } catch (e) {
    console.error('Failed to load kube config:', e);
    throw new Error('Failed to initialize Kubernetes client');
  }

  return {
    coreV1Api: kc.makeApiClient(k8s.CoreV1Api),
    networkingV1Api: kc.makeApiClient(k8s.NetworkingV1Api),
  };
}

// Get all Tailscale Ingress resources
export async function getTailscaleIngresses(): Promise<k8s.V1IngressList> {
  const { networkingV1Api } = getKubernetesClient();

  try {
    const response = await networkingV1Api.listIngressForAllNamespaces({});
    response.items = response.items.filter(
      (ingress) => ingress.spec?.ingressClassName === 'tailscale'
    );

    return response;
  } catch (error) {
    console.error('Error fetching Tailscale Ingresses:', error);
    throw error;
  }
}

// Create a new Tailscale Ingress
export async function createTailscaleIngress(
  ingressData: k8s.V1Ingress
): Promise<k8s.V1Ingress> {
  const { networkingV1Api } = getKubernetesClient();

  try {
    const response = await networkingV1Api.createNamespacedIngress({
      namespace: ingressData.metadata?.namespace || 'default',
      body: ingressData,
    });

    return response;
  } catch (error) {
    console.error('Error creating Tailscale Ingress:', error);
    throw error;
  }
}

// Delete a Tailscale Ingress
export async function deleteTailscaleIngress(
  name: string,
  namespace: string
): Promise<k8s.V1Status> {
  const { networkingV1Api } = getKubernetesClient();

  try {
    const response = await networkingV1Api.deleteNamespacedIngress({
      name,
      namespace,
    });

    return response;
  } catch (error) {
    console.error(`Error deleting Tailscale Ingress ${name}:`, error);
    throw error;
  }
}

// Update a Tailscale Ingress
export async function updateTailscaleIngress(
  ingressData: k8s.V1Ingress
): Promise<k8s.V1Ingress> {
  const { networkingV1Api } = getKubernetesClient();

  try {
    const response = await networkingV1Api.replaceNamespacedIngress({
      name: ingressData.metadata?.name || '',
      namespace: ingressData.metadata?.namespace || 'default',
      body: ingressData,
    });

    return response;
  } catch (error) {
    console.error(
      `Error updating Tailscale Ingress ${ingressData.metadata?.name}:`,
      error
    );
    throw error;
  }
}
