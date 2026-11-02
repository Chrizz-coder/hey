import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import db from '@/lib/db'

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    db.prepare(`
      UPDATE notifications
      SET is_read = 1
      WHERE user_id = ?
    `).run(session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark all notifications read error:', error)
    return NextResponse.json({ error: 'Failed to mark all notifications as read' }, { status: 500 })
  }
}
