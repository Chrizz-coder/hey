import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import db from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notificationId = parseInt(params.id)

    db.prepare(`
      UPDATE notifications
      SET is_read = 1
      WHERE id = ? AND user_id = ?
    `).run(notificationId, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark notification read error:', error)
    return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 })
  }
}
