const { Client } = require('pg');
const { hashPassword } = require('../src/lib/auth/password');

async function setupDatabase() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres'
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Create database if it doesn't exist
    await client.query('CREATE DATABASE campus_global_erp');
    console.log('Database created: campus_global_erp');

    await client.end();

    // Connect to the new database
    const dbClient = new Client({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: 'campus_global_erp'
    });

    await dbClient.connect();
    console.log('Connected to campus_global_erp database');

    // Create users table (simplified version)
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        password_hash VARCHAR(255),
        role VARCHAR(50) DEFAULT 'ADMIN',
        status VARCHAR(50) DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Users table created');

    // Create super admin user
    const adminId = 'usr_super_admin';
    const email = 'admin@campusglobal.az';
    const password = 'admin123';
    const passwordHash = hashPassword(password);

    await dbClient.query(`
      INSERT INTO users (id, email, name, password_hash, role, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        updated_at = NOW()
    `, [adminId, email, 'Super Admin', passwordHash, 'SUPER_ADMIN', 'ACTIVE']);

    console.log('Super admin user created');
    console.log('\n=================================');
    console.log('Login Credentials:');
    console.log('Email: admin@campusglobal.az');
    console.log('Password: admin123');
    console.log('=================================\n');

    await dbClient.end();
    console.log('Setup complete!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

setupDatabase();
