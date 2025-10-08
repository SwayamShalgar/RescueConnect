# 📧 Twilio to Email Migration Guide

## Overview
This document details the migration from Twilio SMS notifications to email-based notifications using Nodemailer with Gmail SMTP.

---

## Why We Migrated

### **Previous System (Twilio SMS)**
- ❌ **Cost**: Twilio charges per SMS message
- ❌ **Complexity**: Requires account setup, phone number purchase
- ❌ **Phone Number Requirements**: Users need valid phone numbers
- ❌ **International Issues**: SMS delivery can fail across borders
- ❌ **Limited Content**: SMS has character limits (160 characters)

### **New System (Email via Nodemailer)**
- ✅ **Free**: Gmail SMTP is free for reasonable usage
- ✅ **Simple Setup**: Just need Gmail credentials
- ✅ **Universal**: Everyone has email addresses
- ✅ **Reliable**: Email delivery is more consistent
- ✅ **Rich Content**: HTML emails with formatting, links, images
- ✅ **Better UX**: Professional-looking notifications

---

## Changes Made

### **1. Dependencies Removed**
```json
// Removed from package.json
"twilio": "^5.7.0"
```

### **2. Environment Variables**
```bash
# REMOVED (Twilio)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# KEPT (Nodemailer - already existed)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
GOVERNMENT_EMAIL=government@example.com
```

### **3. Code Changes**

#### **Before (Twilio SMS)**
```javascript
import twilio from 'twilio';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID, 
  process.env.TWILIO_AUTH_TOKEN
);

// Send SMS
await twilioClient.messages.create({
  body: 'Your request has been completed.',
  from: process.env.TWILIO_PHONE_NUMBER,
  to: normalizedPhoneNumber,
});
```

#### **After (Email)**
```javascript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send Email
await sendEmailNotification(
  userEmail,
  '✅ Your Request Has Been Completed',
  `<html>...</html>` // Rich HTML content
);
```

---

## New Email Notification System

### **Features**
1. **Professional HTML Templates**: Color-coded, responsive design
2. **Rich Content**: Headers, sections, status indicators
3. **Branding**: RescueConnect logo and styling
4. **Action Links**: Direct links to maps, dashboards
5. **Timestamps**: Localized date/time formatting
6. **Status Icons**: Visual indicators (✅ ⚠️ 🆘)

### **Email Types**

#### **1. Request Completion Email**
- **Trigger**: Volunteer marks request as completed
- **Recipient**: User who submitted the request
- **Subject**: "✅ Your Request Has Been Completed - RescueConnect"
- **Content**:
  - Green success banner
  - Personalized greeting
  - Request ID and completion time
  - Thank you message
  - Call-to-action for future requests

#### **2. Emergency Alert Email** (Already existed)
- **Trigger**: Volunteer escalates request to emergency
- **Recipient**: Government/emergency services
- **Subject**: "Emergency Alert: Incident Reported at (lat, lon)"
- **Content**:
  - Volunteer name
  - Incident location (with Google Maps link)
  - Request type and urgency
  - Description and contact info
  - Timestamp

---

## Setup Instructions

### **Step 1: Enable Gmail App Passwords**

1. **Go to Google Account Settings**
   - Visit: https://myaccount.google.com/
   - Click "Security" in left sidebar

2. **Enable 2-Step Verification** (if not already enabled)
   - Click "2-Step Verification"
   - Follow setup wizard

3. **Generate App Password**
   - Go back to Security
   - Click "App passwords" (under 2-Step Verification)
   - Select "Mail" and "Other (Custom name)"
   - Enter "RescueConnect" as name
   - Click "Generate"
   - **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

4. **Add to .env.local**
   ```bash
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=abcdefghijklmnop  # Remove spaces from app password
   GOVERNMENT_EMAIL=emergency@example.com
   ```

### **Step 2: Update Database Schema** (if needed)

Ensure users table has `email` column:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
UPDATE users SET email = CONCAT(username, '@example.com') WHERE email IS NULL;
```

### **Step 3: Test Email Delivery**

```bash
# Start dev server
npm run dev

# Test the email by completing a request
# Check console for "Email sent successfully" message
```

---

## Email Template Customization

### **Current Template Structure**
```html
<div style="max-width: 600px; margin: 0 auto; background-color: #f9f9f9;">
  <!-- Header -->
  <div style="background-color: #10b981; color: white; padding: 20px;">
    <h1>✅ Request Completed</h1>
  </div>
  
  <!-- Body -->
  <div style="background-color: white; padding: 30px;">
    <p>Hello <strong>${userName}</strong>,</p>
    <p>Your request has been completed...</p>
    
    <!-- Info Box -->
    <div style="background-color: #ecfdf5; border-left: 4px solid #10b981;">
      <strong>Status:</strong> Completed<br>
      <strong>Request ID:</strong> #${requestId}
    </div>
  </div>
  
  <!-- Footer -->
  <div style="text-align: center; border-top: 1px solid #e5e7eb;">
    <p>RescueConnect - Community Crisis Response Platform</p>
  </div>
</div>
```

### **Color Scheme**
- **Success (Green)**: `#10b981` - Completed requests
- **Warning (Orange)**: `#f59e0b` - Pending actions
- **Danger (Red)**: `#ef4444` - Emergency alerts
- **Info (Blue)**: `#3b82f6` - General notifications

### **Customization Tips**
1. **Change Colors**: Update hex codes in inline styles
2. **Add Logo**: Insert `<img>` tag with Cloudinary URL
3. **Add Buttons**: Use styled anchor tags with `background-color`
4. **Localization**: Use template literals for multi-language support

---

## Limitations & Considerations

### **Gmail SMTP Limits**
- **Daily Sending Limit**: 500 emails/day (free Gmail account)
- **Rate Limit**: ~100-150 emails/hour
- **Solution**: For high-volume production, consider:
  - Google Workspace (2,000 emails/day)
  - SendGrid (100 emails/day free, then paid)
  - Amazon SES (pay-per-use, very cheap)
  - Mailgun (5,000 emails/month free)

### **Email Deliverability**
- **Spam Folders**: Some emails may be flagged as spam
- **Solution**: 
  - Use consistent "From" address
  - Avoid spam trigger words
  - Include unsubscribe link (for bulk emails)
  - Set up SPF/DKIM records (advanced)

### **Fallback Strategy**
If email delivery fails:
1. Log the error to console/database
2. Display in-app notification
3. Store notification in database for user to view later
4. Consider SMS fallback for critical alerts (future enhancement)

---

## Production Deployment

### **Vercel Environment Variables**
Add these to your Vercel project:
1. Go to Project Settings → Environment Variables
2. Add:
   ```
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_gmail_app_password
   GOVERNMENT_EMAIL=emergency@example.com
   ```
3. Deploy: `vercel --prod`

### **Alternative Email Providers**

#### **SendGrid (Recommended for Production)**
```bash
npm install @sendgrid/mail
```
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

await sgMail.send({
  to: userEmail,
  from: 'noreply@rescueconnect.com',
  subject: 'Request Completed',
  html: htmlContent,
});
```

#### **Amazon SES**
```bash
npm install @aws-sdk/client-ses
```
```javascript
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const client = new SESClient({ region: 'us-east-1' });
```

---

## Testing Checklist

- [ ] Email sent on request completion
- [ ] Email sent on emergency escalation
- [ ] HTML renders correctly in Gmail
- [ ] HTML renders correctly in Outlook
- [ ] Links work (Google Maps, dashboard)
- [ ] Timestamps show correct timezone
- [ ] User names display correctly
- [ ] Email failures logged to console
- [ ] Graceful degradation if email fails
- [ ] Production environment variables set

---

## Migration Rollback (If Needed)

If you need to revert to Twilio:

1. **Reinstall Twilio**
   ```bash
   npm install twilio@^5.7.0
   ```

2. **Restore Code**
   ```javascript
   import twilio from 'twilio';
   const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
   ```

3. **Add Environment Variables**
   ```bash
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=+1...
   ```

4. **Restore SMS Sending Logic**
   ```javascript
   await twilioClient.messages.create({
     body: 'Your request has been completed.',
     from: process.env.TWILIO_PHONE_NUMBER,
     to: normalizedPhoneNumber,
   });
   ```

---

## Benefits Summary

### **Cost Savings**
- **Twilio**: ~$0.0079 per SMS × 1,000 messages/month = **$7.90/month**
- **Gmail**: **$0.00** (free tier)
- **Annual Savings**: **$94.80**

### **User Experience**
- ✅ Rich HTML formatting
- ✅ Professional branding
- ✅ Clickable links (maps, dashboard)
- ✅ Better information density
- ✅ No SMS character limits

### **Developer Experience**
- ✅ Simpler setup (no phone number)
- ✅ Easier testing (check email inbox)
- ✅ Better debugging (full email logs)
- ✅ Template reusability

---

## Future Enhancements

1. **Email Templates Library**: Separate template files
2. **Multi-Language Support**: i18n email templates
3. **Email Queue**: Redis-based queue for high volume
4. **Analytics**: Track open rates, click rates
5. **Unsubscribe**: Allow users to opt-out of non-critical emails
6. **Attachments**: Include PDFs, reports, maps
7. **SMS Fallback**: Use Twilio only for critical alerts
8. **Push Notifications**: Web Push API for instant alerts

---

## Support & Troubleshooting

### **Common Issues**

#### **"Invalid login" error**
- **Cause**: Using regular Gmail password instead of App Password
- **Solution**: Generate App Password from Google Account Settings

#### **"Connection timeout" error**
- **Cause**: Firewall blocking port 587
- **Solution**: Check firewall settings, try port 465 (SSL)

#### **Emails going to spam**
- **Cause**: No SPF/DKIM records, suspicious content
- **Solution**: Add SPF record to DNS, avoid spam trigger words

#### **Rate limit exceeded**
- **Cause**: Sending too many emails too quickly
- **Solution**: Implement email queue with rate limiting

---

## Contact

**Project Owner**: SwayamShalgar  
**Repository**: [RescueConnect](https://github.com/SwayamShalgar/RescueConnect)  
**Email**: shalgarswayam@gmail.com

---

**Migration Completed**: October 8, 2025  
**Version**: 0.1.1 (Email-based notifications)
