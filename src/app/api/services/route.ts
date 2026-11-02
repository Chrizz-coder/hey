import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerOnly = searchParams.get('provider');

    let query = 'SELECT * FROM services WHERE is_active = 1';
    const params: any[] = [];

    if (providerOnly === 'true') {
      query += ' AND provider_id IS NOT NULL';
    }

    query += ' ORDER BY category, name';

    const services = db.prepare(query).all(...params);
    return NextResponse.json(services);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'provider') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, category, icon, price_range } = body;

    if (!name || !description || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = db.prepare(`
      INSERT INTO services (name, description, category, icon, provider_id, price_range, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(name, description, category, icon || null, session.user.id, price_range || null);

    return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
  } catch (error) {
    console.error('Create service error:', error);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}
