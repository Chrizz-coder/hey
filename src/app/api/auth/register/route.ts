import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import db from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name, role, phone } = body

    // Validate input
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['customer', 'provider'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hash(password, 10)

    // Create user
    const result = db.prepare(`
      INSERT INTO users (email, name, password_hash, role, phone)
      VALUES (?, ?, ?, ?, ?)
    `).run(email, name, passwordHash, role, phone || null)

    const userId = result.lastInsertRowid

    // Create profile based on role
    if (role === 'provider') {
      db.prepare(`
        INSERT INTO provider_profiles (user_id, business_name, description)
        VALUES (?, ?, ?)
      `).run(userId, name, '')
    } else if (role === 'customer') {
      db.prepare(`
        INSERT INTO customer_profiles (user_id, address, phone)
        VALUES (?, ?, ?)
      `).run(userId, '', phone || null)
    }

    return NextResponse.json(
      { userId, email, name, role },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
