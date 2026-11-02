'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface Service {
  id: number;
  name: string;
  description: string;
  category: string;
  icon: string;
  price_range: string;
}

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        setServices(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch services:', err);
        setLoading(false);
      });
  }, []);

  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  return (
    <div className="flex-1 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find Local Service Providers
          </h1>
          <p className="text-lg text-gray-600">
            Connect with trusted professionals for all your home and business needs
          </p>
          {!session && (
            <div className="mt-4">
              <Link
                href="/auth/signup"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 inline-block"
              >
                Sign Up to Book Services
              </Link>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading services...</div>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedServices).map(([category, categoryServices]) => (
              <div key={category}>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">{category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryServices.map((service) => (
                    <div
                      key={service.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <Link href={`/providers?service_id=${service.id}`}>
                        <div className="text-4xl mb-3">{service.icon}</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {service.name}
                        </h3>
                        <p className="text-gray-600">{service.description}</p>
                        {service.price_range && (
                          <p className="text-sm font-medium text-blue-600 mt-2">{service.price_range}</p>
                        )}
                      </Link>
                      {session?.user?.role === 'customer' && (
                        <Link
                          href={`/customer/dashboard?service_id=${service.id}`}
                          className="mt-4 block w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 text-center"
                        >
                          Book Service
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
