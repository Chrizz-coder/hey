import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import db from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'provider') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bookingId = parseInt(params.id)
    const body = await request.json()
    const { status } = body

    if (!['accepted', 'rejected', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Get booking details
    const booking = db.prepare('SELECT customer_id, provider_id FROM bookings WHERE id = ?').get(bookingId) as any
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Verify ownership
    if (booking.provider_id !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update booking status
    db.prepare(`
      UPDATE bookings
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, bookingId)

    // Create notification for customer
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, related_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      booking.customer_id,
      `booking_${status}`,
      `Booking ${status}`,
      `Your booking has been ${status}`,
      bookingId
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update booking status error:', error)
    return NextResponse.json({ error: 'Failed to update booking status' }, { status: 500 })
  }
}
