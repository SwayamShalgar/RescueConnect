import { Pool } from 'pg';
import nodemailer from 'nodemailer';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Set up Nodemailer transporter for email alerts
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(request) {
  try {
    const { emergencyType, description, message } = await request.json();
    
    // 1. Get all volunteers and users
    const { rows: volunteers } = await pool.query(`
      SELECT id, name, contact, skills 
      FROM volunteers
    `);

    const { rows: users } = await pool.query(`
      SELECT id, name, contact 
      FROM users
    `);

    const allRecipients = [
      ...volunteers.map(v => ({ ...v, type: 'volunteer' })),
      ...users.map(u => ({ ...u, type: 'user' }))
    ];

    if (allRecipients.length === 0) {
      return Response.json(
        { message: 'No recipients (volunteers or users) available to notify' },
        { status: 400 }
      );
    }

    // 2. Send email notifications
    const sentResults = [];
    const alertMessage = message || `EMERGENCY: ${emergencyType}\n${description || ''}`;
    
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      for (const recipient of allRecipients) {
        try {
          // Check if contact is an email address
          const isEmail = recipient.contact && recipient.contact.includes('@');
          
          if (isEmail) {
            await transporter.sendMail({
              from: process.env.EMAIL_USER,
              to: recipient.contact,
              subject: `🚨 EMERGENCY ALERT: ${emergencyType}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fee2e2; border: 2px solid #dc2626;">
                  <div style="background-color: #dc2626; color: white; padding: 20px; border-radius: 8px; text-align: center;">
                    <h1 style="margin: 0;">🚨 EMERGENCY ALERT</h1>
                  </div>
                  <div style="background-color: white; padding: 30px; border-radius: 8px; margin-top: 20px;">
                    <h2 style="color: #dc2626;">Emergency Type: ${emergencyType}</h2>
                    <p style="font-size: 16px; line-height: 1.6; color: #333;">
                      ${description || 'No additional details provided.'}
                    </p>
                    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                      <p style="margin: 0; color: #991b1b; font-size: 14px;">
                        <strong>Alert Message:</strong><br>
                        ${alertMessage}
                      </p>
                    </div>
                    <p style="font-size: 14px; color: #666; margin-top: 20px;">
                      If you are a volunteer, please respond immediately if you can assist.
                    </p>
                  </div>
                </div>
              `
            });
            sentResults.push({ success: true, contact: recipient.contact, type: recipient.type });
          } else {
            // For phone numbers, log instead (SMS requires MSG91 or similar service)
            console.log(`Alert logged for ${recipient.type} ${recipient.contact}: ${alertMessage}`);
            sentResults.push({ success: true, contact: recipient.contact, type: recipient.type, method: 'logged' });
          }
        } catch (error) {
          console.error(`Failed to notify ${recipient.type} ${recipient.contact}:`, error);
          sentResults.push({ success: false, contact: recipient.contact, type: recipient.type, error: error.message });
        }
      }
    } else {
      console.log('=== SIMULATED ALERT (Email not configured) ===');
      console.log('Message:', alertMessage);
      allRecipients.forEach(r => {
        console.log(`-> To ${r.type}: ${r.contact}`);
        sentResults.push({ success: true, contact: r.contact, type: r.type, method: 'simulated' });
      });
    }

    // 3. Return results
    const successfulSends = sentResults.filter(r => r.success).length;
    const successfulVolunteerSends = sentResults.filter(r => r.success && r.type === 'volunteer').length;
    const successfulUserSends = sentResults.filter(r => r.success && r.type === 'user').length;

    return Response.json({ 
      message: 'Alert processing completed',
      totalRecipients: allRecipients.length,
      totalVolunteers: volunteers.length,
      totalUsers: users.length,
      successfulSends,
      successfulVolunteerSends,
      successfulUserSends,
      failedSends: allRecipients.length - successfulSends,
      details: sentResults
    });

  } catch (error) {
    console.error('Error processing alert:', error);
    return Response.json(
      { message: 'Error processing alert', error: error.message },
      { status: 500 }
    );
  }
}