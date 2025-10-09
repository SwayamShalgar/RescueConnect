import { NextResponse } from "next/server";
import pool from "../../../../../lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

const authenticateAdmin = (req) => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return { error: 'Authorization header missing', status: 401 };
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return { error: 'Unauthorized: Admin access only', status: 403 };
    }
    return { admin: decoded, adminId: decoded.id };
  } catch (error) {
    return { error: 'Invalid or expired token', status: 403 };
  }
};

// GET - Fetch all requests and volunteers
export async function GET(req) {
  try {
    const authResult = authenticateAdmin(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const client = await pool.connect();

    try {
      // Fetch all requests with assigned volunteer info
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

      // Fetch all volunteers with their current location
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

      // Get statistics
      const statsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM requests WHERE status = 'pending') as pending_requests,
          (SELECT COUNT(*) FROM requests WHERE status = 'accepted') as accepted_requests,
          (SELECT COUNT(*) FROM requests WHERE status = 'emergency') as emergency_requests,
          (SELECT COUNT(*) FROM volunteers) as total_volunteers,
          (SELECT COUNT(*) FROM requests WHERE created_at > NOW() - INTERVAL '24 hours') as requests_today
      `;
      const statsResult = await client.query(statsQuery);

      client.release();

      return NextResponse.json({
        requests: requestsResult.rows,
        volunteers: volunteersResult.rows,
        stats: statsResult.rows[0],
      }, { status: 200 });

    } catch (error) {
      client.release();
      throw error;
    }

  } catch (err) {
    console.error("Admin dashboard error:", err);
    return NextResponse.json({ error: "Server error.", message: err.message }, { status: 500 });
  }
}

// DELETE - Delete a request (admin only)
export async function DELETE(req) {
  try {
    const authResult = authenticateAdmin(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      const result = await client.query(
        'DELETE FROM requests WHERE id = $1 RETURNING *',
        [requestId]
      );

      client.release();

      if (result.rowCount === 0) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 });
      }

      return NextResponse.json({
        message: 'Request deleted successfully',
        request: result.rows[0]
      }, { status: 200 });

    } catch (error) {
      client.release();
      throw error;
    }

  } catch (err) {
    console.error("Delete request error:", err);
    return NextResponse.json({ error: "Server error.", message: err.message }, { status: 500 });
  }
}
