import pool from "../../../../../lib/db";
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const GOVERNMENT_EMAIL = process.env.GOVERNMENT_EMAIL || 'government@example.com';

// Helper function to send email notifications
const sendEmailNotification = async (to, subject, htmlContent) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@disaster-response.com',
      to,
      subject,
      html: htmlContent,
    });
    console.log(`Email sent successfully to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

const authenticateToken = (req) => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return { error: 'Authorization header missing', status: 401 };
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { user: decoded, volunteerId: decoded.id };
  } catch (error) {
    return { error: 'Invalid or expired token', status: 403 };
  }
};

// Normalize phone number to E.164 format
const normalizePhoneNumber = (phone) => {
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    cleaned = `+1${cleaned}`; // Assuming US numbers; adjust country code as needed
  }
  return cleaned;
};

export async function GET(req) {
  try {
    const authResult = authenticateToken(req);
    if (authResult.error) {
      return new Response(JSON.stringify({ error: authResult.error }), {
        status: authResult.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const client = await pool.connect();
    const result = await client.query('SELECT * FROM requests ORDER BY created_at DESC');
    client.release();

    return new Response(JSON.stringify(result.rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PATCH(req) {
  try {
    const authResult = authenticateToken(req);
    if (authResult.error) {
      return new Response(JSON.stringify({ error: authResult.error }), {
        status: authResult.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const volunteerId = authResult.volunteerId;
    const { requestId } = await req.json();

    if (!requestId) {
      return new Response(JSON.stringify({ error: 'Missing requestId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const client = await pool.connect();

    const result = await client.query(
      'UPDATE requests SET status = $1, assigned_to = $2 WHERE id = $3 AND LOWER(status) = LOWER($4) RETURNING *',
      ['accepted', volunteerId, requestId, 'pending']
    );

    client.release();

    if (result.rowCount === 0) {
      return new Response(JSON.stringify({ error: 'Request not found or already accepted' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result.rows[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating request:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(req) {
  try {
    const authResult = authenticateToken(req);
    if (authResult.error) {
      return new Response(JSON.stringify({ error: authResult.error }), {
        status: authResult.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const volunteerId = authResult.volunteerId;
    const { requestId } = await req.json();

    if (!requestId) {
      return new Response(JSON.stringify({ error: 'Missing requestId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const client = await pool.connect();

    try {
      // Check if the request exists and is assigned to the volunteer
      const requestCheck = await client.query(
        'SELECT name, contact FROM requests WHERE id = $1 AND assigned_to = $2 AND LOWER(status) = LOWER($3)',
        [requestId, volunteerId, 'accepted']
      );

      if (requestCheck.rowCount === 0) {
        client.release();
        return new Response(JSON.stringify({ error: 'Request not found, not assigned to you, or not in accepted status' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const requestData = requestCheck.rows[0];
      const userName = requestData.name || 'User';
      const userContact = requestData.contact;

      // Check if contact is an email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const userEmail = emailRegex.test(userContact) ? userContact : null;

    // Delete the request from database (mark as completed)
    const result = await client.query(
      'DELETE FROM requests WHERE id = $1 AND assigned_to = $2 RETURNING *',
      [requestId, volunteerId]
    );

    if (result.rowCount === 0) {
      client.release();
      return new Response(JSON.stringify({ error: 'Failed to delete completed request' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Send email notification to the user
    if (userEmail) {
      const emailResult = await sendEmailNotification(
        userEmail,
        '✅ Your Request Has Been Completed - RescueConnect',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0;">✅ Request Completed</h1>
            </div>
            <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <p style="font-size: 16px; color: #333;">Hello <strong>${userName || 'User'}</strong>,</p>
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Great news! Your emergency request has been successfully completed by our volunteer team.
              </p>
              <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #065f46; font-size: 14px;">
                  <strong>Status:</strong> Completed<br>
                  <strong>Request ID:</strong> #${requestId}<br>
                  <strong>Completed At:</strong> ${new Date().toLocaleString('en-US', { 
                    dateStyle: 'medium', 
                    timeStyle: 'short' 
                  })}
                </p>
              </div>
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Thank you for using <strong>RescueConnect</strong>. We hope you are safe and the assistance provided was helpful.
              </p>
              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                If you need further assistance, please don't hesitate to submit another request through our platform.
              </p>
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #9ca3af; margin: 5px 0;">
                  Stay safe! 🛡️
                </p>
                <p style="font-size: 12px; color: #9ca3af; margin: 5px 0;">
                  <strong>RescueConnect</strong> - Community Crisis Response Platform
                </p>
              </div>
            </div>
          </div>
        `
      );

      if (!emailResult.success) {
        console.error('Failed to send completion email:', emailResult.error);
        // Continue execution - don't fail the request if email fails
      }
    } else {
      console.log('No email available for user, notification skipped');
    }

    client.release();

    return new Response(JSON.stringify({
      message: 'Request completed and deleted successfully',
      request: result.rows[0],
      success: true,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
    } catch (error) {
      console.error('Error marking request as completed:', error);
      console.error('Error stack:', error.stack);
      
      if (client) {
        try {
          client.release();
        } catch (releaseError) {
          console.error('Error releasing client:', releaseError);
        }
      }
      
      return new Response(JSON.stringify({ 
        error: error.message || 'Internal Server Error',
        success: false,
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in POST handler:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      success: false,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(req) {
  let client;
  try {
    const authResult = authenticateToken(req);
    if (authResult.error) {
      return new Response(JSON.stringify({ error: authResult.error }), {
        status: authResult.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const volunteerId = authResult.volunteerId;
    const { requestId } = await req.json();

    if (!requestId) {
      return new Response(JSON.stringify({ error: 'Missing requestId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    client = await pool.connect();

    // Check if the request exists and is assigned to the volunteer
    const requestCheckQuery = `
      SELECT r.*, v.name as volunteer_name
      FROM requests r
      JOIN volunteers v ON v.id = $1
      WHERE r.id = $2 AND r.status = 'accepted' AND r.assigned_to = $1;
    `;
    const requestCheckResult = await client.query(requestCheckQuery, [volunteerId, requestId]);
    if (requestCheckResult.rowCount === 0) {
      client.release();
      return new Response(JSON.stringify({ error: 'Request not found, not accepted, or not assigned to you.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const requestData = requestCheckResult.rows[0];

    // Send email to government email address using Nodemailer (before deleting)
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@disaster-response.com',
      to: GOVERNMENT_EMAIL,
      subject: `Emergency Alert: Incident Reported at (${requestData.latitude}, ${requestData.longitude})`,
      html: `
        <h2>Emergency Incident Report</h2>
        <p><strong>Reported by Volunteer:</strong> ${requestData.volunteer_name}</p>
        <p><strong>Incident Location:</strong> Latitude ${requestData.latitude}, Longitude ${requestData.longitude}</p>
        <p><strong>Google Maps Link:</strong> <a href="https://www.google.com/maps?q=${requestData.latitude},${requestData.longitude}">View on Map</a></p>
        <p><strong>Request Type:</strong> ${requestData.type}</p>
        <p><strong>Urgency:</strong> ${requestData.urgency}</p>
        <p><strong>Description:</strong> ${requestData.description || 'No description provided.'}</p>
        <p><strong>Contact:</strong> ${requestData.contact}</p>
        <p><strong>Reported At:</strong> ${new Date().toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          dateStyle: 'medium',
          timeStyle: 'medium',
        })}</p>
        <p>Please take immediate action to address this emergency.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Emergency email sent to ${GOVERNMENT_EMAIL}`);

    // Send alerts to nearby volunteers (non-blocking, don't fail if alerts fail)
    try {
      // Find nearby volunteers and send alerts directly (avoiding fetch issues)
      const nearbyVolunteersQuery = `
        SELECT id, name, contact, lat, long
        FROM volunteers
        WHERE lat IS NOT NULL 
        AND long IS NOT NULL
        AND id != $1
        AND (
          6371 * acos(
            cos(radians($2)) * cos(radians(lat)) * 
            cos(radians(long) - radians($3)) + 
            sin(radians($2)) * sin(radians(lat))
          )
        ) <= 10
        ORDER BY (
          6371 * acos(
            cos(radians($2)) * cos(radians(lat)) * 
            cos(radians(long) - radians($3)) + 
            sin(radians($2)) * sin(radians(lat))
          )
        ) ASC;
      `;
      
      const nearbyVolunteersResult = await client.query(nearbyVolunteersQuery, [
        volunteerId,
        requestData.latitude,
        requestData.longitude
      ]);

      const nearbyVolunteers = nearbyVolunteersResult.rows;
      
      if (nearbyVolunteers && nearbyVolunteers.length > 0) {
        // Insert alert into alerts table
        const insertAlertQuery = `
          INSERT INTO alerts (latitude, longitude, message, timestamp)
          VALUES ($1, $2, $3, $4)
          RETURNING id;
        `;
        const alertMessage = `Emergency Alert: ${requestData.type} incident reported by ${requestData.volunteer_name}. Urgency: ${requestData.urgency}. Description: ${requestData.description || 'No description provided.'}`;
        const alertResult = await client.query(insertAlertQuery, [
          requestData.latitude,
          requestData.longitude,
          alertMessage,
          new Date().toISOString()
        ]);
        
        const alertId = alertResult.rows[0].id;

        // Insert alert recipients
        if (nearbyVolunteers.length > 0) {
          const insertRecipientsQuery = `
            INSERT INTO alert_recipients (alert_id, volunteer_id, name, contact)
            VALUES ${nearbyVolunteers.map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`).join(', ')};
          `;
          const recipientValues = nearbyVolunteers.flatMap((volunteer) => [
            alertId,
            volunteer.id,
            volunteer.name,
            volunteer.contact,
          ]);
          await client.query(insertRecipientsQuery, recipientValues);
        }

        console.log(`Alerts sent to ${nearbyVolunteers.length} nearby volunteers`);
      } else {
        console.log('No nearby volunteers found within 10 km');
      }
    } catch (alertError) {
      console.error('Error sending alerts to nearby volunteers:', alertError.message);
      // Continue execution - don't fail the request if alerts fail
    }

    // Delete the request from database after sending emergency alerts
    const deleteRequestQuery = `
      DELETE FROM requests
      WHERE id = $1 AND assigned_to = $2
      RETURNING *;
    `;
    const deleteRequestResult = await client.query(deleteRequestQuery, [requestId, volunteerId]);
    if (deleteRequestResult.rowCount === 0) {
      client.release();
      return new Response(JSON.stringify({ error: 'Failed to delete emergency request' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const deletedRequest = deleteRequestResult.rows[0];

    if (client) {
      client.release();
    }

    return new Response(JSON.stringify({
      message: 'Emergency reported. Government notified, alerts sent, and request removed from database.',
      request: deletedRequest,
      success: true,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error marking request as emergency:', error);
    console.error('Error stack:', error.stack);
    
    // Ensure client is released
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error('Error releasing client:', releaseError);
      }
    }
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal Server Error',
      success: false,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}