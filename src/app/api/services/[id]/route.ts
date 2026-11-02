import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import db from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'provider') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceId = parseInt((await params).id);
    const body = await request.json();
    const { name, description, category, icon, price_range, is_active } = body;

    // Verify ownership
    const service = db.prepare('SELECT provider_id FROM services WHERE id = ?').get(serviceId) as { provider_id: number | null } | undefined;
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    if (service.provider_id !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    db.prepare(`
      UPDATE services
      SET name = ?, description = ?, category = ?, icon = ?, price_range = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name,
      description,
      category,
      icon || null,
      price_range || null,
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      serviceId
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update service error:', error);
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'provider') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceId = parseInt((await params).id);

    // Verify ownership
    const service = db.prepare('SELECT provider_id FROM services WHERE id = ?').get(serviceId) as { provider_id: number | null } | undefined;
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    if (service.provider_id !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    db.prepare('DELETE FROM services WHERE id = ?').run(serviceId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete service error:', error);
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
  }
}
