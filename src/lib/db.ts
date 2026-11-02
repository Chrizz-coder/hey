import Database from 'better-sqlite3';
import path from 'path';
import { hashSync } from 'bcryptjs';

const dbPath = path.join(process.cwd(), 'data', 'services.db');
const db = new Database(dbPath);

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    icon TEXT,
    provider_id INTEGER,
    price_range TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('customer', 'provider', 'admin')),
    phone TEXT,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS provider_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    business_name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    years_experience INTEGER,
    rating REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS customer_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    address TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    provider_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
    scheduled_date DATETIME,
    estimated_duration INTEGER,
    description TEXT,
    price_estimate REAL,
    actual_price REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (provider_id) REFERENCES users(id),
    FOREIGN KEY (service_id) REFERENCES services(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    related_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
  );

  -- Legacy providers table for backward compatibility (will be migrated)
  CREATE TABLE IF NOT EXISTS providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    service_id INTEGER NOT NULL,
    phone TEXT,
    email TEXT,
    location TEXT,
    rating REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    description TEXT,
    years_experience INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id INTEGER NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES providers(id)
  );
`);

// Create indexes for performance
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_provider ON bookings(provider_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
  CREATE INDEX IF NOT EXISTS idx_services_provider ON services(provider_id);
  CREATE INDEX IF NOT EXISTS idx_messages_booking ON messages(booking_id);
`);

// Seed initial data if empty
const serviceCount = db.prepare('SELECT COUNT(*) as count FROM services').get() as { count: number };
if (serviceCount.count === 0) {
  const insertService = db.prepare(`
    INSERT INTO services (name, description, category, icon, provider_id, price_range, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const services = [
    { name: 'Plumbing', description: 'Pipe repair, installation, and maintenance', category: 'Home Maintenance', icon: '🔧' },
    { name: 'Electrical', description: 'Wiring, lighting, and electrical repairs', category: 'Home Maintenance', icon: '⚡' },
    { name: 'Carpentry', description: 'Woodwork, furniture repair, and custom builds', category: 'Home Maintenance', icon: '🪚' },
    { name: 'Painting', description: 'Interior and exterior painting services', category: 'Home Maintenance', icon: '🎨' },
    { name: 'HVAC', description: 'Heating, ventilation, and air conditioning', category: 'Home Maintenance', icon: '❄️' },
    { name: 'Cleaning', description: 'Deep cleaning and regular maintenance', category: 'Home Maintenance', icon: '🧹' },
    { name: 'Landscaping', description: 'Garden care, lawn mowing, and outdoor work', category: 'Outdoor', icon: '🌳' },
    { name: 'Moving', description: 'Packing, loading, and transportation', category: 'Logistics', icon: '🚚' },
    { name: 'Appliance Repair', description: 'Fix and maintain household appliances', category: 'Home Maintenance', icon: '🔌' },
    { name: 'Roofing', description: 'Roof repair, installation, and inspection', category: 'Home Maintenance', icon: '🏠' },
  ];

  services.forEach(service => {
    insertService.run(service.name, service.description, service.category, service.icon, null, null, 1);
  });

  // Seed sample providers
  const insertProvider = db.prepare(`
    INSERT INTO providers (name, service_id, phone, email, location, rating, review_count, description, years_experience)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const providers = [
    { name: 'John Smith Plumbing', service_id: 1, phone: '555-0101', email: 'john@plumbing.com', location: 'Downtown', rating: 4.5, review_count: 23, description: 'Expert plumber with 15 years of experience', years_experience: 15 },
    { name: 'Quick Fix Electric', service_id: 2, phone: '555-0102', email: 'info@quickfix.com', location: 'Westside', rating: 4.8, review_count: 45, description: 'Licensed electricians available 24/7', years_experience: 10 },
    { name: 'Master Carpenter Co', service_id: 3, phone: '555-0103', email: 'contact@mastercarpenter.com', location: 'Eastside', rating: 4.7, review_count: 31, description: 'Custom woodworking and furniture repair', years_experience: 20 },
    { name: 'Pro Paint Services', service_id: 4, phone: '555-0104', email: 'info@propaint.com', location: 'Northside', rating: 4.3, review_count: 18, description: 'Professional interior and exterior painting', years_experience: 8 },
    { name: 'Cool Air HVAC', service_id: 5, phone: '555-0105', email: 'service@coolair.com', location: 'Downtown', rating: 4.6, review_count: 52, description: 'Heating and cooling specialists', years_experience: 12 },
  ];

  providers.forEach(provider => {
    insertProvider.run(
      provider.name,
      provider.service_id,
      provider.phone,
      provider.email,
      provider.location,
      provider.rating,
      provider.review_count,
      provider.description,
      provider.years_experience
    );
  });

  // Seed test users (for development)
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (email, name, password_hash, role, phone)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertProviderProfile = db.prepare(`
      INSERT INTO provider_profiles (user_id, business_name, description, location, years_experience, rating, review_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertCustomerProfile = db.prepare(`
      INSERT INTO customer_profiles (user_id, address, phone)
      VALUES (?, ?, ?)
    `);

    // Create test provider
    const providerPassword = hashSync('provider123', 10);
    const providerUser = insertUser.run(
      'provider@test.com',
      'Test Provider',
      providerPassword,
      'provider',
      '555-9999'
    );
    db.prepare('UPDATE services SET provider_id = ? WHERE provider_id IS NULL').run(providerUser.lastInsertRowid);

    insertProviderProfile.run(
      providerUser.lastInsertRowid,
      'Test Provider Business',
      'Professional service provider with expertise in multiple areas',
      'Downtown',
      10,
      4.5,
      23
    );

    // Create test customer
    const customerPassword = hashSync('customer123', 10);
    const customerUser = insertUser.run(
      'customer@test.com',
      'Test Customer',
      customerPassword,
      'customer',
      '555-8888'
    );
    insertCustomerProfile.run(
      customerUser.lastInsertRowid,
      '123 Main St',
      '555-8888'
    );
  }
}

export default db;
