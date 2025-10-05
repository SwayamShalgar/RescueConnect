import { NextResponse } from 'next/server';
import pool from "../../../../../lib/db";

export async function GET() {
  try {
    // Check database structure
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'volunteers'
      ORDER BY ordinal_position
    `);
    
    const volunteersResult = await pool.query(`
      SELECT id, name, contact, lat, long, status
      FROM volunteers 
      LIMIT 10
    `);
    
    return NextResponse.json({
      columns: columnsResult.rows,
      volunteers: volunteersResult.rows
    }, { status: 200 });
    
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({ 
      error: 'Database test failed', 
      details: error.message 
    }, { status: 500 });
  }
}
