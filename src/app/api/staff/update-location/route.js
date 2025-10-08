import { NextResponse } from "next/server";
import pool from "../../../../../lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

export async function POST(req) {
  try {
    // Get authorization token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const volunteerId = decoded.id;
    const body = await req.json();
    const { latitude, longitude } = body;

    // Validate coordinates
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json({ message: "Invalid coordinates" }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      // Check for duplicate coordinates (excluding current volunteer)
      const checkDuplicateQuery = `
        SELECT id, name FROM volunteers 
        WHERE lat = $1 AND long = $2 AND id != $3
        LIMIT 1
      `;
      const duplicateCheck = await client.query(checkDuplicateQuery, [latitude, longitude, volunteerId]);
      
      if (duplicateCheck.rows.length > 0) {
        client.release();
        return NextResponse.json({ 
          message: "A volunteer is already registered at this exact location. Please verify your coordinates.",
          duplicate: true
        }, { status: 409 });
      }

      // Check which optional columns exist
      const checkColumnsQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'volunteers' 
        AND column_name IN ('status', 'last_login')
      `;
      const columnCheck = await client.query(checkColumnsQuery);
      const existingColumns = columnCheck.rows.map(row => row.column_name);
      const hasStatusColumn = existingColumns.includes('status');
      const hasLastLoginColumn = existingColumns.includes('last_login');

      // Build UPDATE query dynamically
      let updateFields = 'lat = $1, long = $2';
      
      if (hasStatusColumn) {
        updateFields += ", status = 'available'";
      }
      
      if (hasLastLoginColumn) {
        updateFields += ', last_login = NOW()';
      }
      
      const updateLocationQuery = `
        UPDATE volunteers 
        SET ${updateFields}
        WHERE id = $3
        RETURNING id
      `;
      
      const result = await client.query(updateLocationQuery, [latitude, longitude, volunteerId]);
      
      if (result.rowCount > 0) {
        client.release();
        return NextResponse.json({ 
          message: "Location updated successfully",
          latitude,
          longitude
        }, { status: 200 });
      }
      
      client.release();
      return NextResponse.json({ message: "Volunteer not found" }, { status: 404 });
      
    } catch (locationError) {
      console.error('Failed to update location:', locationError.message);
      client.release();
      return NextResponse.json({ 
        message: "Failed to update location",
        error: locationError.message 
      }, { status: 500 });
    }

  } catch (err) {
    console.error("Update location error:", err);
    return NextResponse.json({ 
      message: "Server error", 
      error: err.message 
    }, { status: 500 });
  }
}
