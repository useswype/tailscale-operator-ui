// app/page.tsx
import IngressList from '@/app/components/ingress/ingress-list';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="border-b border-blue-100 bg-white py-6 shadow-md">
        <div className="container mx-auto px-6">
          <h1 className="text-3xl font-bold text-blue-700">
            Tailscale Ingress Visualizer
          </h1>
          <p className="mt-2 text-gray-600">
            View and manage Tailscale Ingress resources in your Kubernetes
            cluster
          </p>
        </div>
      </header>

      <div className="container mx-auto mt-6 mb-auto p-6">
        <IngressList />
      </div>

      <footer className="sticky bottom-0 mt-12 border-t border-blue-100 bg-white py-6">
        <div className="container mx-auto px-6 text-center text-sm text-gray-500">
          <p>Swypex Engineering &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </main>
  );
}
