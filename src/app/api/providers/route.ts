import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('service_id');

    let query = `
      SELECT p.*, s.name as service_name, s.icon as service_icon 
      FROM providers p 
      JOIN services s ON p.service_id = s.id
    `;
    const params: (string | number)[] = [];

    if (serviceId) {
      query += ' WHERE p.service_id = ?';
      params.push(serviceId);
    }

    query += ' ORDER BY p.rating DESC';

    const providers = db.prepare(query).all(...params);
    return NextResponse.json(providers);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 });
  }
}
