import { NextResponse } from "next/server";
import pool from "../../../../../lib/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch (err) {
    console.error("Error parsing request body:", err);
    return NextResponse.json({ message: "Invalid JSON in request body." }, { status: 400 });
  }

  const { contact, password, latitude, longitude } = body;

  // Validate required fields
  if (!contact || !password) {
    return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
  }

  try {
    const client = await pool.connect();
    console.log("Database connection established");

    // Check if the volunteer exists by contact (email or phone)
    const checkQuery = "SELECT * FROM volunteers WHERE contact = $1";
    const result = await client.query(checkQuery, [contact]);
    console.log("Check query result:", result.rows);

    if (result.rows.length === 0) {
      client.release();
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
    }

    const volunteer = result.rows[0];

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, volunteer.password);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      client.release();
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
    }

    // Update volunteer's location if provided
    if (latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
      try {
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
        `;
        
        await client.query(updateLocationQuery, [latitude, longitude, volunteer.id]);
        console.log('Location updated successfully:', latitude, longitude);
      } catch (locationError) {
        console.error('Failed to update location:', locationError.message);
        // Continue with login even if location update fails
      }
    }

    client.release();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: volunteer.id, 
        name: volunteer.name,
        contact: volunteer.contact,
        role: 'volunteer'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return success response with token and volunteer details (excluding password)
    const { password: _, ...volunteerWithoutPassword } = volunteer;
    return NextResponse.json(
      { 
        message: "Login successful.", 
        token,
        volunteer: volunteerWithoutPassword 
      },
      { status: 200 }
    );

  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ message: "Server error.", error: err.message }, { status: 500 });
  }
}