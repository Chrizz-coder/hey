import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import db from '@/lib/db'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = `
      SELECT b.*, s.name as service_name, u.name as customer_name, u2.name as provider_name
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.customer_id = u.id
      JOIN users u2 ON b.provider_id = u2.id
      WHERE 1=1
    `
    const params: (string | number)[] = []

    if (session.user.role === 'customer') {
      query += ' AND b.customer_id = ?'
      params.push(session.user.id)
    } else if (session.user.role === 'provider') {
      query += ' AND b.provider_id = ?'
      params.push(session.user.id)
    }

    if (status) {
      query += ' AND b.status = ?'
      params.push(status)
    }

    query += ' ORDER BY b.created_at DESC'

    const bookings = db.prepare(query).all(...params)
    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Fetch bookings error:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { provider_id, service_id, scheduled_date, description, estimated_duration } = body

    if (!service_id || !scheduled_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get service to verify it exists and get the provider
    const service = db.prepare('SELECT provider_id FROM services WHERE id = ?').get(service_id) as { provider_id: number | null } | undefined
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Use the service's provider_id if not specified
    const finalProviderId = provider_id || service.provider_id
    if (!finalProviderId) {
      return NextResponse.json({ error: 'This service has no provider yet' }, { status: 400 })
    }

    // Create booking
    const result = db.prepare(`
      INSERT INTO bookings (customer_id, provider_id, service_id, scheduled_date, description, estimated_duration)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      session.user.id,
      finalProviderId,
      service_id,
      scheduled_date,
      description || null,
      estimated_duration || null
    )

    const bookingId = result.lastInsertRowid

    // Create notification for provider
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, related_id)
      VALUES (?, 'booking_request', 'New Booking Request', ?, ?)
    `).run(
      finalProviderId,
      `New booking request for service #${service_id}`,
      bookingId
    )

    return NextResponse.json({ bookingId }, { status: 201 })
  } catch (error) {
    console.error('Create booking error:', error)
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }
}
