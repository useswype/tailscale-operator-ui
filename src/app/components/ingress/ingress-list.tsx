'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/app/components/ui/button';
import { formatDate, getIngressStatus } from '@/app/lib/utils';
import { TailscaleIngressList } from '@/app/types';
import { V1Ingress } from '@kubernetes/client-node';
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaSync,
  FaExternalLinkAlt,
  FaNetworkWired,
  FaDownload,
} from 'react-icons/fa';
import IngressForm from './ingress-form';
import { exportIngressesToYaml } from '@/app/lib/yaml-exporter';

const fetcher = (url: string): Promise<TailscaleIngressList> =>
  fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    return res.json();
  });

export default function IngressList() {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [selectedIngress, setSelectedIngress] = useState<V1Ingress | undefined>(
    undefined
  );

  // Fetch data using SWR
  const { data, error, isLoading, mutate } = useSWR<TailscaleIngressList>(
    '/api/ingress',
    fetcher,
    { refreshInterval: 10000 } // Refresh every 10 seconds
  );

  const handleAddClick = (): void => {
    setSelectedIngress(undefined);
    setShowForm(true);
  };

  const handleEditClick = (ingress: V1Ingress): void => {
    setSelectedIngress(ingress);
    setShowForm(true);
  };

  const handleDeleteClick = async (ingress: V1Ingress): Promise<void> => {
    if (!ingress.metadata?.name || !ingress.metadata?.namespace) {
      alert('Missing ingress name or namespace');
      return;
    }

    if (confirm(`Are you sure you want to delete ${ingress.metadata.name}?`)) {
      try {
        await fetch(
          `/api/ingress?name=${ingress.metadata.name}&namespace=${ingress.metadata.namespace}`,
          {
            method: 'DELETE',
          }
        );
        mutate(); // Refresh data after delete
      } catch (error) {
        console.error('Error deleting ingress:', error);
        alert('Failed to delete ingress');
      }
    }
  };

  const handleFormClose = (): void => {
    setShowForm(false);
  };

  const handleFormSuccess = (): void => {
    setShowForm(false);
    mutate(); // Refresh data after successful form submission
  };

  if (error)
    return (
      <div className="p-4 text-red-500">Failed to load ingress resources</div>
    );
  if (isLoading) return <div className="p-4">Loading...</div>;

  // Filter the ingresses to only show Tailscale ingresses
  const tailscaleIngresses =
    data?.items?.filter(
      (ingress) => ingress.spec?.ingressClassName === 'tailscale'
    ) || [];

  return (
    <div className="container mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="flex items-center text-2xl font-bold text-blue-700">
          <FaNetworkWired className="mr-3 text-blue-500" />
          Tailscale Ingress Resources
        </h1>
        <div className="flex gap-3">
          <Button
            onClick={() => mutate()}
            variant="outline"
            size="sm"
            className="flex items-center border-blue-200 bg-white text-blue-600 hover:bg-blue-50"
          >
            <FaSync className="mr-2" /> Refresh
          </Button>
          <Button
            onClick={() =>
              tailscaleIngresses && exportIngressesToYaml(tailscaleIngresses)
            }
            variant="outline"
            size="sm"
            className="flex items-center border-green-200 bg-white text-green-600 hover:bg-green-50"
            disabled={!tailscaleIngresses || tailscaleIngresses.length === 0}
          >
            <FaDownload className="mr-2" /> Export YAML
          </Button>
          <Button
            onClick={handleAddClick}
            size="sm"
            className="flex items-center bg-blue-600 shadow-sm hover:bg-blue-700"
          >
            <FaPlus className="mr-2" /> Add Ingress
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Namespace
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Host
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Path
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Service
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Port
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Created
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {tailscaleIngresses.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-4 text-center text-gray-900"
                  >
                    No Tailscale Ingress resources found
                  </td>
                </tr>
              ) : (
                tailscaleIngresses.map((ingress) => {
                  // Extract the first rule & path for display
                  const rule = ingress.spec?.rules?.[0];
                  const path = rule?.http?.paths?.[0];

                  let link = '#';

                  const hostname =
                    ingress.status?.loadBalancer?.ingress?.[0].hostname;
                  if (hostname) {
                    const https =
                      ingress.status?.loadBalancer?.ingress?.[0].ports?.some(
                        (port) => port.port === 443
                      ) ?? false;

                    link = `${https ? 'https' : 'http'}://${hostname}${path?.path || '/'}`;
                  }

                  return (
                    <tr
                      key={`${ingress.metadata?.namespace}-${ingress.metadata?.name}`}
                      className="border-t border-gray-200 text-gray-600"
                    >
                      <td className="px-4 py-3">
                        <a
                          href={link}
                          className="text-gray-700 hover:text-blue-800"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {ingress.metadata?.name || '-'}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        {ingress.metadata?.namespace || '-'}
                      </td>
                      <td className="px-4 py-3">{rule?.host || '-'}</td>
                      <td className="px-4 py-3">{path?.path || '/'}</td>
                      <td className="px-4 py-3">
                        {path?.backend.service?.name || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {path?.backend.service?.port?.number || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                            getIngressStatus(ingress.status) === 'Ready'
                              ? 'bg-green-100 text-green-800'
                              : getIngressStatus(ingress.status) === 'Pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {getIngressStatus(ingress.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {ingress.metadata?.creationTimestamp
                          ? formatDate(
                              ingress.metadata.creationTimestamp.toString()
                            )
                          : 'Unknown'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          {getIngressStatus(ingress.status) === 'Ready' && (
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-9 items-center justify-center rounded-md bg-blue-50 px-3 text-sm font-medium text-blue-700 hover:bg-blue-100"
                            >
                              <FaExternalLinkAlt />
                            </a>
                          )}
                          <Button
                            onClick={() => handleEditClick(ingress)}
                            className="text-white"
                            variant="outline"
                            size="sm"
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            onClick={() => handleDeleteClick(ingress)}
                            variant="destructive"
                            size="sm"
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {showForm && (
          <IngressForm
            ingress={selectedIngress}
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
          />
        )}
      </div>
    </div>
  );
}
