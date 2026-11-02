import { NextResponse, connection } from 'next/server'
import { auth } from '@/lib/auth'
import db from '@/lib/db'

export async function GET() {
  await connection()

  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(session.user.id)

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Fetch notifications error:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}
