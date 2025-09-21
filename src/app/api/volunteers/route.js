import { NextResponse } from 'next/server';
import pool from "../../../../lib/db";

export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM volunteers');
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching volunteers:', error);
    return NextResponse.json({ error: 'Failed to fetch volunteers' }, { status: 500 });
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