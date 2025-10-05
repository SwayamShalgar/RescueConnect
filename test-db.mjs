import pool from './lib/db.js';

async function testDatabase() {
  try {
    console.log('Testing database connection...\n');
    
    // Check if lat/long columns exist
    console.log('1. Checking for location columns:');
    const columnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'volunteers' 
      AND column_name IN ('lat', 'long', 'latitude', 'longitude')
      ORDER BY column_name
    `);
    console.log('Location columns found:', columnsResult.rows);
    
    // Check volunteers table structure
    console.log('\n2. All columns in volunteers table:');
    const allColumnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'volunteers'
      ORDER BY ordinal_position
    `);
    console.log(allColumnsResult.rows);
    
    // Check existing volunteers
    console.log('\n3. Existing volunteers:');
    const volunteersResult = await pool.query(`
      SELECT id, name, contact, lat, long 
      FROM volunteers 
      LIMIT 5
    `);
    console.log(volunteersResult.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testDatabase();
