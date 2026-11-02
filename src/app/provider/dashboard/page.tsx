'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/lib/useNotifications'

interface Service {
  id: number
  name: string
  description: string
  category: string
  icon: string
  price_range: string
  is_active: number
}

interface Booking {
  id: number
  service_name: string
  customer_name: string
  scheduled_date: string
  description: string
  status: string
}

export default function ProviderDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { notifications, unreadCount, markAsRead, markAllAsRead, refresh: refreshNotifications } = useNotifications(session?.user?.id, status === 'authenticated')
  const [services, setServices] = useState<Service[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(() => {
    return Promise.all([
      fetch('/api/services?provider=true'),
      fetch('/api/bookings')
    ])
      .then(async ([servicesRes, bookingsRes]) => {
        if (servicesRes.ok) {
          setServices(await servicesRes.json())
        }

        if (bookingsRes.ok) {
          setBookings(await bookingsRes.json())
        }

        refreshNotifications()
      })
      .catch((error) => console.error('Failed to fetch data:', error))
      .finally(() => setLoading(false))
  }, [refreshNotifications])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (session && session.user.role !== 'provider') {
      router.push('/')
    } else if (session) {
      fetchData()
    }
  }, [session, status, router, fetchData])

  const handleDeleteService = async (id: number) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setServices(services.filter(s => s.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete service:', error)
    }
  }

  const handleBookingAction = async (bookingId: number, action: 'accept' | 'reject') => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action === 'accept' ? 'accepted' : 'rejected' })
      })

      if (res.ok) {
        setBookings(bookings.map(b =>
          b.id === bookingId ? { ...b, status: action === 'accept' ? 'accepted' : 'rejected' } : b
        ))
      }
    } catch (error) {
      console.error('Failed to update booking:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Provider Dashboard</h1>

        {/* Services Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">My Services</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add Service
            </button>
          </div>
          {services.length === 0 ? (
            <div className="bg-white p-6 rounded-lg text-center text-gray-500">
              No services yet. Create your first service!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <div key={service.id} className="bg-white border p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-2xl">{service.icon}</span>
                      <h3 className="font-semibold text-lg">{service.name}</h3>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${service.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {service.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{service.description}</p>
                  <p className="text-sm text-gray-500 mb-3">{service.category}</p>
                  {service.price_range && (
                    <p className="text-sm font-medium text-blue-600 mb-3">{service.price_range}</p>
                  )}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingService(service)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteService(service.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bookings Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Booking Requests</h2>
          {bookings.filter((b: Booking) => b.status === 'pending').length === 0 ? (
            <div className="bg-white p-6 rounded-lg text-center text-gray-500">
              No pending booking requests
            </div>
          ) : (
            <div className="space-y-4">
              {bookings
                .filter((b: Booking) => b.status === 'pending')
                .map((booking: Booking) => (
                  <div key={booking.id} className="bg-white border p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{booking.service_name}</h3>
                        <p className="text-gray-600">Customer: {booking.customer_name}</p>
                        <p className="text-gray-600">
                          Date: {new Date(booking.scheduled_date).toLocaleDateString()}
                        </p>
                        {booking.description && (
                          <p className="text-gray-500 text-sm mt-2">{booking.description}</p>
                        )}
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                        Pending
                      </span>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => handleBookingAction(booking.id, 'accept')}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleBookingAction(booking.id, 'reject')}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </h2>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Mark all as read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="bg-white p-6 rounded-lg text-center text-gray-500">
              No notifications
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg ${notification.is_read === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{notification.title}</p>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    {notification.is_read === 0 && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Bookings */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">All Bookings</h2>
          {bookings.length === 0 ? (
            <div className="bg-white p-6 rounded-lg text-center text-gray-500">
              No bookings yet
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking: Booking) => (
                <div key={booking.id} className="bg-white border p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{booking.service_name}</h3>
                      <p className="text-gray-600">Customer: {booking.customer_name}</p>
                      <p className="text-gray-600">
                        Date: {new Date(booking.scheduled_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      booking.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Service Modal */}
      {(showCreateModal || editingService) && (
        <CreateServiceModal
          service={editingService}
          onClose={() => {
            setShowCreateModal(false)
            setEditingService(null)
          }}
          onSuccess={() => {
            setShowCreateModal(false)
            setEditingService(null)
            fetchData()
          }}
        />
      )}
    </div>
  )
}

function CreateServiceModal({
  service,
  onClose,
  onSuccess
}: {
  service: Service | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    category: service?.category || '',
    icon: service?.icon || '',
    price_range: service?.price_range || '',
    is_active: service?.is_active !== undefined ? service.is_active === 1 : true
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = service ? `/api/services/${service.id}` : '/api/services'
      const method = service ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        onSuccess()
      }
    } catch (error) {
      console.error('Failed to save service:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">
          {service ? 'Edit Service' : 'Create Service'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Service Name"
            className="w-full border p-2 rounded"
            required
          />
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description"
            className="w-full border p-2 rounded"
            rows={3}
            required
          />
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full border p-2 rounded"
            required
          >
            <option value="">Select Category</option>
            <option value="Home Maintenance">Home Maintenance</option>
            <option value="Outdoor">Outdoor</option>
            <option value="Logistics">Logistics</option>
          </select>
          <input
            type="text"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            placeholder="Icon (emoji)"
            className="w-full border p-2 rounded"
          />
          <input
            type="text"
            value={formData.price_range}
            onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
            placeholder="Price Range (e.g., $50-$100)"
            className="w-full border p-2 rounded"
          />
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded"
            />
            <span>Active</span>
          </label>
          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded flex-1 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (service ? 'Update' : 'Create')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 px-4 py-2 rounded flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
