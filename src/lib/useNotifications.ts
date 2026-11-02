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

  const fetchNotifications = useCallback(async () => {
    if (!userId || !enabled) return

    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
        setUnreadCount(data.filter((n: Notification) => n.is_read === 0).length)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
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
