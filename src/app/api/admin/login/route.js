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

  const { adminid, password } = body;

  // Validate required fields
  if (!adminid || !password) {
    return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
  }

  try {
    const client = await pool.connect();
    console.log("Database connection established for admin login");

    // Check if the admin exists
    const checkQuery = "SELECT * FROM admins WHERE adminid = $1";
    const result = await client.query(checkQuery, [adminid]);
    console.log("Admin check query result:", result.rows.length > 0 ? "Admin found" : "Admin not found");

    if (result.rows.length === 0) {
      client.release();
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
    }

    const admin = result.rows[0];

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, admin.password);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      client.release();
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
    }

    client.release();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin.id, 
        adminid: admin.adminid,
        name: 'Administrator', // Default name since table doesn't have this column
        role: 'admin'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return success response with token and admin details (excluding password)
    return NextResponse.json(
      { 
        message: "Admin login successful.", 
        token,
        admin: {
          id: admin.id,
          adminid: admin.adminid,
          name: 'Administrator'
        }
      },
      { status: 200 }
    );

  } catch (err) {
    console.error("Admin login error:", err);
    return NextResponse.json({ message: "Server error.", error: err.message }, { status: 500 });
  }
}
