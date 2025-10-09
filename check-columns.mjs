import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://communitycrisisresponseplatform_owner:npg_CU1Ha0OzsrIw@ep-calm-band-a9371n21-pooler.gwc.azure.neon.tech/communitycrisisresponseplatform',
  ssl: { rejectUnauthorized: false }
});

async function checkColumns() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'volunteers' 
      ORDER BY ordinal_position
    `);
    
    console.log('Volunteers table columns:');
    result.rows.forEach(c => {
      console.log(`  ${c.column_name}: ${c.data_type}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  await pool.end();
}

checkColumns();
