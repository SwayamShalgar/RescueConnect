import { NextResponse } from 'next/server';
import pool from "../../../../lib/db";

export async function GET() {
  try {
    // Check which optional columns exist
    const checkColumnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'volunteers' 
      AND column_name IN ('status', 'last_login')
    `;
    const columnCheck = await pool.query(checkColumnsQuery);
    const existingColumns = columnCheck.rows.map(row => row.column_name);
    const hasStatusColumn = existingColumns.includes('status');
    const hasLastLoginColumn = existingColumns.includes('last_login');

    // Build SELECT query dynamically based on existing columns
    let selectFields = `
      id, 
      name, 
      contact, 
      skills, 
      certifications,
      aadhaar_image_url,
      lat as latitude,
      long as longitude
    `;
    
    if (hasStatusColumn) {
      selectFields += `,\n        status`;
    }
    
    if (hasLastLoginColumn) {
      selectFields += `,\n        last_login`;
    }
    
    const selectQuery = `
      SELECT ${selectFields}
      FROM volunteers
    `;
    
    console.log('Query:', selectQuery);
    const result = await pool.query(selectQuery);
    
    console.log(`Found ${result.rows.length} total volunteers in database`);
    console.log('Available columns:', { hasStatusColumn, hasLastLoginColumn });
    
    // Filter volunteers that have location data
    const volunteersWithLocation = result.rows
      .filter(v => v.latitude !== null && v.longitude !== null)
      .map(volunteer => {
        const volunteerData = {
          id: volunteer.id,
          name: volunteer.name,
          contact: volunteer.contact,
          skills: volunteer.skills,
          certifications: volunteer.certifications,
          aadhaar_image_url: volunteer.aadhaar_image_url,
          latitude: Number(volunteer.latitude),
          longitude: Number(volunteer.longitude),
          status: hasStatusColumn ? (volunteer.status || 'available') : 'available'
        };
        
        // Only include last_login if the column exists
        if (hasLastLoginColumn) {
          volunteerData.last_login = volunteer.last_login;
        }
        
        return volunteerData;
      });
    
    console.log(`Returning ${volunteersWithLocation.length} volunteers with location data`);
    
    // Always return 200 with array (empty or with data)
    return NextResponse.json(volunteersWithLocation, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching volunteers:', error);
    return NextResponse.json({ error: 'Failed to fetch volunteers', details: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, contact, password, skills, aadhaar_image_url, certifications, requests } = await request.json();
    if (!name || !contact || !password || !skills) {
      return NextResponse.json({ error: 'Name, contact, password, and skills are required' }, { status: 400 });
    }

    const query = 'INSERT INTO volunteers (name, contact, password, skills, aadhaar_image_url, certifications, requests) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
    const values = [name, contact, password, skills, aadhaar_image_url || null, certifications || null, requests || null];
    const result = await pool.query(query, values);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating volunteer:', error);
    return NextResponse.json({ error: 'Failed to create volunteer' }, { status: 500 });
  }
}