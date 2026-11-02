'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Provider {
  id: number;
  name: string;
  service_id: number;
  service_name: string;
  service_icon: string;
  phone: string;
  email: string;
  location: string;
  rating: number;
  review_count: number;
  description: string;
  years_experience: number;
}

function ProvidersContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const serviceId = searchParams.get('service_id');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = serviceId ? `/api/providers?service_id=${serviceId}` : '/api/providers';
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setProviders(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch providers:', err);
        setLoading(false);
      });
  }, [serviceId]);

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <span key={i} className="text-yellow-400">★</span>
        ))}
        {hasHalfStar && <span className="text-yellow-400">★</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={i} className="text-gray-300">★</span>
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Services
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">
            {serviceId ? 'Service Providers' : 'All Providers'}
          </h1>
          <p className="text-gray-600 mt-2">
            {providers.length} provider{providers.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading providers...</div>
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">No providers found</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-3xl mb-2">{provider.service_icon}</div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {provider.name}
                    </h3>
                    <p className="text-sm text-gray-600">{provider.service_name}</p>
                  </div>
                </div>

                <div className="mb-4">
                  {renderStars(provider.rating)}
                  <p className="text-sm text-gray-500 mt-1">
                    {provider.review_count} review{provider.review_count !== 1 ? 's' : ''}
                  </p>
                </div>

                <p className="text-gray-700 mb-4">{provider.description}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <span className="font-medium w-24">Location:</span>
                    <span>{provider.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <span className="font-medium w-24">Experience:</span>
                    <span>{provider.years_experience} years</span>
                  </div>
                  {provider.phone && (
                    <div className="flex items-center text-gray-600">
                      <span className="font-medium w-24">Phone:</span>
                      <span>{provider.phone}</span>
                    </div>
                  )}
                  {provider.email && (
                    <div className="flex items-center text-gray-600">
                      <span className="font-medium w-24">Email:</span>
                      <span className="text-blue-600">{provider.email}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <Link
                    href={`/provider/${provider.id}`}
                    className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-center"
                  >
                    View Profile
                  </Link>
                  {session?.user?.role === 'customer' && (
                    <Link
                      href={`/customer/dashboard?service_id=${provider.service_id}`}
                      className="block w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-center"
                    >
                      Book Service
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProvidersPage() {
  return (
    <Suspense fallback={<div className="flex-1 bg-gray-50"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"><div className="text-center py-12"><div className="text-gray-500">Loading...</div></div></div></div>}>
      <ProvidersContent />
    </Suspense>
  );
}
