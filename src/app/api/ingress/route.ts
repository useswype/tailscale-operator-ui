// app/api/ingress/route.ts
import { NextResponse } from 'next/server';
import {
  getTailscaleIngresses,
  createTailscaleIngress,
  deleteTailscaleIngress,
  updateTailscaleIngress,
} from '@/app/lib/k8s/client';
import { IngressFormInput } from '@/app/types';
import { V1Ingress } from '@kubernetes/client-node';

// GET handler to fetch all ingresses
export async function GET(): Promise<NextResponse> {
  try {
    const data = await getTailscaleIngresses();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/ingress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Tailscale Ingress resources' },
      { status: 500 }
    );
  }
}

// POST handler to create a new ingress
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData: IngressFormInput = await request.json();

    // Transform form data to standard k8s ingress format
    const ingressResource: V1Ingress = {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'Ingress',
      metadata: {
        name: formData.name,
        namespace: formData.namespace,
        labels: {
          ...(formData.proxyClass
            ? { 'proxy-class': formData.proxyClass }
            : {}),
        },
        annotations: {
          ...(formData.tags ? { tags: formData.tags } : {}),
        },
      },
      spec: {
        ingressClassName: 'tailscale',
        defaultBackend: {
          service: {
            name: formData.serviceName,
            port: {
              number: formData.servicePort,
            },
          },
        },
        tls: formData.tlsEnabled
          ? [
              {
                hosts: [formData.name],
              },
            ]
          : undefined,
      },
    };

    const result = await createTailscaleIngress(ingressResource);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in POST /api/ingress:', error);
    return NextResponse.json(
      { error: 'Failed to create Tailscale Ingress resource' },
      { status: 500 }
    );
  }
}

// PUT handler to update an existing ingress
export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const formData: IngressFormInput = await request.json();

    // Transform form data to standard k8s ingress format
    const ingressResource: V1Ingress = {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'Ingress',
      metadata: {
        name: formData.name,
        namespace: formData.namespace,
        labels: {
          ...(formData.tags ? { tags: formData.tags } : {}),
          ...(formData.proxyClass
            ? { 'proxy-class': formData.proxyClass }
            : {}),
        },
      },
      spec: {
        ingressClassName: 'tailscale',
        rules: [
          {
            host: formData.host,
            http: {
              paths: [
                {
                  path: formData.path || '/',
                  pathType: formData.pathType || 'Prefix',
                  backend: {
                    service: {
                      name: formData.serviceName,
                      port: {
                        number: formData.servicePort,
                      },
                    },
                  },
                },
              ],
            },
          },
        ],
        tls:
          formData.tlsEnabled && formData.tlsSecretName
            ? [
                {
                  hosts: [formData.host],
                  secretName: formData.tlsSecretName,
                },
              ]
            : undefined,
      },
    };

    const result = await updateTailscaleIngress(ingressResource);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in PUT /api/ingress:', error);
    return NextResponse.json(
      { error: 'Failed to update Tailscale Ingress resource' },
      { status: 500 }
    );
  }
}

// DELETE handler to delete an ingress
export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const name = url.searchParams.get('name');
    const namespace = url.searchParams.get('namespace');

    if (!name || !namespace) {
      return NextResponse.json(
        { error: 'Name and namespace parameters are required' },
        { status: 400 }
      );
    }

    const result = await deleteTailscaleIngress(name, namespace);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in DELETE /api/ingress:', error);
    return NextResponse.json(
      { error: 'Failed to delete Tailscale Ingress resource' },
      { status: 500 }
    );
  }
}
