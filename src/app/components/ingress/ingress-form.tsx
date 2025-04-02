'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { Button } from '@/app/components/ui/button';
import { IngressFormInput } from '@/app/types';
import { V1Ingress } from '@kubernetes/client-node';
import { FaEdit, FaPlus, FaTimes } from 'react-icons/fa';

interface IngressFormProps {
  ingress?: V1Ingress;
  onClose: () => void;
  onSuccess: () => void;
}

export default function IngressForm({
  ingress,
  onClose,
  onSuccess,
}: IngressFormProps) {
  const isEditing = !!ingress;

  // Parse the ingress object to create initial form data
  const getInitialFormData = (): IngressFormInput => {
    if (!ingress) {
      return {
        name: '',
        namespace: 'default',
        host: '',
        serviceName: '',
        servicePort: 80,
        path: '/',
        pathType: 'Prefix',
        tlsEnabled: false,
        tlsSecretName: '',
        tags: '',
        proxyClass: '',
      };
    }

    const rule = ingress.spec?.rules?.[0];
    const path = rule?.http?.paths?.[0];
    const tls = ingress.spec?.tls?.[0];
    const labels = ingress.metadata?.labels || {};

    return {
      name: ingress.metadata?.name || '',
      namespace: ingress.metadata?.namespace || 'default',
      host: rule?.host || '',
      serviceName: path?.backend.service?.name || '',
      servicePort: path?.backend.service?.port?.number || 80,
      path: path?.path || '/',
      pathType:
        (path?.pathType as 'Exact' | 'Prefix' | 'ImplementationSpecific') ||
        'Prefix',
      tlsEnabled: !!tls,
      tlsSecretName: tls?.secretName || '',
      tags: labels['tags'] || '',
      proxyClass: labels['proxy-class'] || '',
    };
  };

  const [formData, setFormData] =
    useState<IngressFormInput>(getInitialFormData());
  const [errors, setErrors] = useState<
    Partial<Record<keyof IngressFormInput, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (name === 'tlsEnabled') {
      setFormData((prev) => ({
        ...prev,
        tlsEnabled: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value, 10) : value,
      }));
    }

    // Clear error when field is modified
    if (errors[name as keyof IngressFormInput]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof IngressFormInput, string>> = {};

    if (!formData.name) {
      newErrors.name = 'Name is required';
    } else if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(formData.name)) {
      newErrors.name =
        'Name must consist of lowercase alphanumeric characters or "-"';
    }

    if (!formData.namespace) {
      newErrors.namespace = 'Namespace is required';
    }

    if (!formData.host) {
      newErrors.host = 'Host is required';
    }

    if (!formData.serviceName) {
      newErrors.serviceName = 'Service name is required';
    }

    if (!formData.servicePort || formData.servicePort <= 0) {
      newErrors.servicePort = 'Valid service port is required';
    }

    if (formData.tlsEnabled && !formData.tlsSecretName) {
      newErrors.tlsSecretName =
        'TLS Secret name is required when TLS is enabled';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/ingress', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save ingress');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving ingress:', error);
      alert(
        `Failed to ${isEditing ? 'update' : 'create'} ingress: ${(error as Error).message}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-opacity-75 fixed inset-0 z-50 flex items-center justify-center bg-gray-800 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="flex items-center text-xl font-semibold text-blue-700">
            {isEditing ? (
              <>
                <FaEdit className="mr-3 text-blue-500" />
                Edit Ingress:{' '}
                <span className="ml-2 font-bold">{formData.name}</span>
              </>
            ) : (
              <>
                <FaPlus className="mr-3 text-blue-500" />
                Create New Ingress
              </>
            )}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            aria-label="Close"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 text-gray-700 placeholder:text-gray-400"
        >
          <div className="mb-6 rounded-r-md border-l-4 border-blue-500 bg-blue-50 p-4">
            <p className="text-sm text-blue-700">
              {isEditing
                ? 'Edit the Ingress configuration below. Name and namespace cannot be changed after creation.'
                : 'Fill in the details below to create a new Tailscale Ingress resource.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isEditing}
                className={`w-full rounded-md border px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                } ${isEditing ? 'bg-gray-50 text-gray-500' : ''}`}
                placeholder="my-ingress"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Lowercase letters, numbers, and hyphens only
              </p>
            </div>

            <div className="col-span-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Namespace <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="namespace"
                value={formData.namespace}
                onChange={handleInputChange}
                disabled={isEditing}
                className={`w-full rounded-md border px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                  errors.namespace ? 'border-red-500' : 'border-gray-300'
                } ${isEditing ? 'bg-gray-50 text-gray-500' : ''}`}
                placeholder="default"
              />
              {errors.namespace && (
                <p className="mt-1 text-xs text-red-500">{errors.namespace}</p>
              )}
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Host <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="host"
                value={formData.host}
                onChange={handleInputChange}
                placeholder="myservice.example.com"
                className={`w-full rounded-md border px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                  errors.host ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.host && (
                <p className="mt-1 text-xs text-red-500">{errors.host}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                The hostname that Tailscale will use to expose your service
              </p>
            </div>

            <div className="col-span-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Service Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="serviceName"
                value={formData.serviceName}
                onChange={handleInputChange}
                className={`w-full rounded-md border px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                  errors.serviceName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="my-service"
              />
              {errors.serviceName && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.serviceName}
                </p>
              )}
            </div>

            <div className="col-span-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Service Port <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="servicePort"
                value={formData.servicePort}
                onChange={handleInputChange}
                min="1"
                max="65535"
                className={`w-full rounded-md border px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                  errors.servicePort ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="80"
              />
              {errors.servicePort && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.servicePort}
                </p>
              )}
            </div>

            <div className="col-span-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Path
              </label>
              <input
                type="text"
                name="path"
                value={formData.path}
                onChange={handleInputChange}
                placeholder="/"
                className="w-full rounded-md border border-gray-300 px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Default: /</p>
            </div>

            <div className="col-span-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Path Type
              </label>
              <select
                name="pathType"
                value={formData.pathType}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="Prefix">Prefix</option>
                <option value="Exact">Exact</option>
                <option value="ImplementationSpecific">
                  Implementation Specific
                </option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                How the path should be matched
              </p>
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tags
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="app,env:prod,team:infrastructure"
                className="w-full rounded-md border border-gray-300 px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Comma-separated list of tags to add as labels to the Ingress
                resource
              </p>
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Proxy Class
              </label>
              <input
                type="text"
                name="proxyClass"
                value={formData.proxyClass}
                onChange={handleInputChange}
                placeholder="external"
                className="w-full rounded-md border border-gray-300 px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional proxy class to add as a label to the Ingress resource
              </p>
            </div>

            <div className="col-span-2">
              <div className="mt-4 flex items-center rounded-lg border border-gray-200 bg-gray-50 p-3">
                <input
                  type="checkbox"
                  id="tlsEnabled"
                  name="tlsEnabled"
                  checked={formData.tlsEnabled}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="tlsEnabled"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Enable TLS (HTTPS)
                </label>
              </div>
            </div>

            {formData.tlsEnabled && (
              <div className="col-span-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  TLS Secret Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="tlsSecretName"
                  value={formData.tlsSecretName}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                    errors.tlsSecretName ? 'border-red-500' : 'border-gray-300'
                  } bg-white`}
                  placeholder="my-tls-secret"
                />
                {errors.tlsSecretName && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.tlsSecretName}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  The name of the Kubernetes secret containing the TLS
                  certificate and key
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-gray-300 text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              {isSubmitting
                ? 'Saving...'
                : isEditing
                  ? 'Update Ingress'
                  : 'Create Ingress'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
