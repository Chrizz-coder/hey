import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const providerId = parseInt(params.id);

    const provider = db.prepare(`
      SELECT p.*, s.name as service_name, s.icon as service_icon 
      FROM providers p 
      JOIN services s ON p.service_id = s.id
      WHERE p.id = ?
    `).get(providerId);

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    return NextResponse.json(provider);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch provider' }, { status: 500 });
  }
}
