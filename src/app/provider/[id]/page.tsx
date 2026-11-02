'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
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

function ProviderProfileContent() {
  const params = useParams();
  const providerId = params.id as string;
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/providers/${providerId}`)
      .then(res => res.json())
      .then(data => {
        setProvider(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch provider:', err);
        setLoading(false);
      });
  }, [providerId]);

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <span key={i} className="text-yellow-400 text-2xl">★</span>
        ))}
        {hasHalfStar && <span className="text-yellow-400 text-2xl">★</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={i} className="text-gray-300 text-2xl">★</span>
        ))}
        <span className="ml-3 text-xl text-gray-700">({rating})</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-12">
            <div className="text-gray-500">Loading provider...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-12">
            <div className="text-gray-500">Provider not found</div>
            <Link href="/providers" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
              ← Back to Providers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/providers"
          className="text-blue-600 hover:text-blue-800 mb-8 inline-block"
        >
          ← Back to Providers
        </Link>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-100 px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-5xl mb-3">{provider.service_icon}</div>
                <h1 className="text-3xl font-bold text-gray-900">{provider.name}</h1>
                <p className="text-lg text-gray-600 mt-1">{provider.service_name}</p>
              </div>
              <div className="text-right">
                {renderStars(provider.rating)}
                <p className="text-gray-600 mt-2">
                  {provider.review_count} review{provider.review_count !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
                <p className="text-gray-700 leading-relaxed">{provider.description}</p>

                <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Contact Information</h2>
                <div className="space-y-3">
                  {provider.phone && (
                    <div className="flex items-center text-gray-700">
                      <span className="font-medium w-32">Phone:</span>
                      <span>{provider.phone}</span>
                    </div>
                  )}
                  {provider.email && (
                    <div className="flex items-center text-gray-700">
                      <span className="font-medium w-32">Email:</span>
                      <a
                        href={`mailto:${provider.email}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {provider.email}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center text-gray-700">
                    <span className="font-medium w-32">Location:</span>
                    <span>{provider.location}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <span className="font-medium w-32">Experience:</span>
                    <span>{provider.years_experience} years</span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-4">
                  <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors text-lg font-medium">
                    Contact Provider
                  </button>
                  <button className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-md hover:bg-gray-200 transition-colors text-lg font-medium">
                    Request Quote
                  </button>
                  <button className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-md hover:bg-gray-50 transition-colors text-lg font-medium">
                    View Reviews
                  </button>
                </div>

                <div className="mt-8 p-4 bg-blue-50 rounded-md border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">Availability</h3>
                  <p className="text-blue-800 text-sm">
                    This provider typically responds within 24 hours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProviderProfilePage() {
  return (
    <Suspense fallback={<div className="flex-1 bg-gray-50"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"><div className="text-center py-12"><div className="text-gray-500">Loading...</div></div></div></div>}>
      <ProviderProfileContent />
    </Suspense>
  );
}
