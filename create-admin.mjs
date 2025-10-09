// Script to create admin user with hashed password
// Run this with: node create-admin.mjs

import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';
import { readFileSync } from 'fs';

// Read DATABASE_URL from .env.local
const envContent = readFileSync('.env.local', 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)/);
const DATABASE_URL = dbUrlMatch ? dbUrlMatch[1].trim() : null;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function createAdmin() {
  const client = await pool.connect();
  
  try {
    // Hash the password
    const password = 'admin123'; // Change this to your desired password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('Creating admin user...');
    
    // Check if admin already exists
    const checkResult = await client.query(
      'SELECT * FROM admins WHERE adminid = $1',
      ['admin']
    );
    
    let result;
    if (checkResult.rows.length > 0) {
      // Update existing admin
      result = await client.query(
        'UPDATE admins SET password = $1 WHERE adminid = $2 RETURNING *',
        [hashedPassword, 'admin']
      );
      console.log('Admin user updated.');
    } else {
      // Insert new admin user
      result = await client.query(
        `INSERT INTO admins (adminid, password) 
         VALUES ($1, $2) 
         RETURNING *`,
        ['admin', hashedPassword]
      );
      console.log('Admin user created.');
    }
    
    console.log('✅ Admin user created successfully!');
    console.log('Admin ID:', result.rows[0].adminid);
    console.log('Password:', password);
    console.log('\n⚠️  Please change the password after first login!');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createAdmin();
