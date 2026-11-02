'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/lib/useNotifications'

interface Booking {
  id: number
  service_name: string
  provider_name: string
  scheduled_date: string
  description: string
  status: string
}

interface Service {
  id: number
  name: string
  description: string
  category: string
  icon: string
  price_range: string
}

interface Notification {
  id: number
  type: string
  title: string
  message: string
  is_read: number
  created_at: string
}

export default function CustomerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { notifications, unreadCount, markAsRead, markAllAsRead, refresh: refreshNotifications } = useNotifications(session?.user?.id, status === 'authenticated')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (session && session.user.role !== 'customer') {
      router.push('/')
    } else if (session) {
      fetchData()
    }
  }, [session, status, router])

  const fetchData = async () => {
    try {
      const [bookingsRes, servicesRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/services')
      ])

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json()
        setBookings(bookingsData)
      }

      if (servicesRes.ok) {
        const servicesData = await servicesRes.json()
        setServices(servicesData)
      }

      refreshNotifications()
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBookService = (service: Service) => {
    setSelectedService(service)
    setShowBookingModal(true)
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
        <h1 className="text-3xl font-bold mb-8">My Bookings</h1>

        {/* Bookings Section */}
        <div className="mb-8">
          {bookings.length === 0 ? (
            <div className="bg-white p-6 rounded-lg text-center text-gray-500">
              No bookings yet. Browse services below to book one!
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="bg-white border p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{booking.service_name}</h3>
                      <p className="text-gray-600">Provider: {booking.provider_name}</p>
                      <p className="text-gray-600">
                        Date: {new Date(booking.scheduled_date).toLocaleDateString()}
                      </p>
                      {booking.description && (
                        <p className="text-gray-500 text-sm mt-2">{booking.description}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      booking.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      booking.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  {booking.status === 'completed' && (
                    <button className="mt-4 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">
                      Rate Provider
                    </button>
                  )}
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

        {/* Available Services */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Available Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <div key={service.id} className="bg-white border p-4 rounded-lg">
                <div className="text-3xl mb-2">{service.icon}</div>
                <h3 className="font-semibold text-lg">{service.name}</h3>
                <p className="text-gray-600 text-sm mb-2">{service.description}</p>
                <p className="text-sm text-gray-500 mb-3">{service.category}</p>
                {service.price_range && (
                  <p className="text-sm font-medium text-blue-600 mb-3">{service.price_range}</p>
                )}
                <button
                  onClick={() => handleBookService(service)}
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  Book Service
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedService && (
        <BookingModal
          service={selectedService}
          onClose={() => {
            setShowBookingModal(false)
            setSelectedService(null)
          }}
          onSuccess={() => {
            setShowBookingModal(false)
            setSelectedService(null)
            fetchData()
          }}
        />
      )}
    </div>
  )
}

function BookingModal({
  service,
  onClose,
  onSuccess
}: {
  service: Service
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    scheduled_date: '',
    description: '',
    estimated_duration: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: service.id,
          scheduled_date: formData.scheduled_date,
          description: formData.description,
          estimated_duration: formData.estimated_duration ? parseInt(formData.estimated_duration) : null
        })
      })

      if (res.ok) {
        onSuccess()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to create booking')
      }
    } catch (error) {
      console.error('Failed to create booking:', error)
      alert('Failed to create booking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Book {service.name}</h2>
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">{service.description}</p>
          {service.price_range && (
            <p className="text-sm font-medium text-blue-600 mt-1">{service.price_range}</p>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Date *
            </label>
            <input
              type="date"
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              className="w-full border p-2 rounded"
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Duration (minutes)
            </label>
            <input
              type="number"
              value={formData.estimated_duration}
              onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
              placeholder="e.g., 60"
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Details
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your requirements..."
              className="w-full border p-2 rounded"
              rows={3}
            />
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded flex-1 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
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
