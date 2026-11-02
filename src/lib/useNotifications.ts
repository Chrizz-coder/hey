import { useEffect, useState, useCallback } from 'react'

interface Notification {
  id: number
  type: string
  title: string
  message: string
  is_read: number
  created_at: string
}

export function useNotifications(userId: string | undefined, enabled: boolean = true) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(() => {
    if (!userId || !enabled) return Promise.resolve()

    return fetch('/api/notifications')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Notification[] | null) => {
        if (data) {
          setNotifications(data)
          setUnreadCount(data.filter((n) => n.is_read === 0).length)
        }
      })
      .catch((error) => console.error('Failed to fetch notifications:', error))
  }, [userId, enabled])

  useEffect(() => {
    if (!userId || !enabled) return

    // Initial fetch
    fetchNotifications()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)

    return () => clearInterval(interval)
  }, [userId, enabled, fetchNotifications])

  const markAsRead = async (notificationId: number) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'PUT' })
      fetchNotifications()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'PUT' })
      fetchNotifications()
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications
  }
}
