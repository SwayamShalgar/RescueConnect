import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://communitycrisisresponseplatform_owner:npg_CU1Ha0OzsrIw@ep-calm-band-a9371n21-pooler.gwc.azure.neon.tech/communitycrisisresponseplatform',
  ssl: { rejectUnauthorized: false }
});

async function testQueries() {
  const client = await pool.connect();
  
  try {
    console.log('Testing requests query...');
    const requestsQuery = `
      SELECT 
        r.*,
        v.name as volunteer_name,
        v.contact as volunteer_contact
      FROM requests r
      LEFT JOIN volunteers v ON r.assigned_to = v.id
      ORDER BY 
        CASE r.status
          WHEN 'emergency' THEN 1
          WHEN 'accepted' THEN 2
          WHEN 'pending' THEN 3
          ELSE 4
        END,
        r.created_at DESC
    `;
    const requestsResult = await client.query(requestsQuery);
    console.log('Requests count:', requestsResult.rows.length);

    console.log('\nTesting volunteers query...');
    const volunteersQuery = `
      SELECT 
        id,
        name,
        contact,
        skills,
        lat,
        long,
        created_at
      FROM volunteers
      ORDER BY created_at DESC
    `;
    const volunteersResult = await client.query(volunteersQuery);
    console.log('Volunteers count:', volunteersResult.rows.length);
    console.log('Volunteers:', JSON.stringify(volunteersResult.rows, null, 2));

    console.log('\nTesting stats query...');
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM requests WHERE status = 'pending') as pending_requests,
        (SELECT COUNT(*) FROM requests WHERE status = 'accepted') as accepted_requests,
        (SELECT COUNT(*) FROM requests WHERE status = 'emergency') as emergency_requests,
        (SELECT COUNT(*) FROM volunteers) as total_volunteers,
        (SELECT COUNT(*) FROM requests WHERE created_at > NOW() - INTERVAL '24 hours') as requests_today
    `;
    const statsResult = await client.query(statsQuery);
    console.log('Stats:', JSON.stringify(statsResult.rows[0], null, 2));

    client.release();
    console.log('\n✅ All queries successful!');
    
  } catch (error) {
    console.error('❌ Query error:', error);
    client.release();
  }
  
  await pool.end();
}

testQueries();
