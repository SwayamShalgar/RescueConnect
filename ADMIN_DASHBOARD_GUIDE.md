# Admin Dashboard Implementation Guide

## Overview
Complete admin system with authentication, monitoring, and management capabilities for RescueConnect.

## Database Setup

### 1. Create Admins Table

```sql
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    adminid VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Insert Admin User

Run the script to create an admin user with hashed password:

```bash
node create-admin.mjs
```

**Default Credentials:**
- Admin ID: `admin`
- Password: `admin123`

⚠️ **Important**: Change the password after first login!

## Features

### Admin Login
- **Route**: `/adminlogin`
- **API**: `/api/admin/login`
- Secure JWT-based authentication
- Role-based access control (admin only)
- 7-day token expiration

### Admin Dashboard
- **Route**: `/admindashboard`
- **API**: `/api/admin/dashboard`
- Real-time monitoring
- Statistics overview
- Request management
- Volunteer monitoring
- Map access

## Dashboard Features

### 1. Statistics Cards
- Total Volunteers
- Pending Requests
- Emergency Alerts
- Requests Today

### 2. Tabs
- **Overview**: Recent requests and active volunteers
- **Requests**: All requests with full details
- **Volunteers**: All volunteers with status
- **Map Access**: Direct links to both maps

### 3. Request Management
- View all requests
- Filter by status (pending, accepted, emergency)
- Delete requests (admin only)
- View location on map
- See assigned volunteer

### 4. Volunteer Monitoring
- View all volunteers
- Check online/offline status
- See last login time
- View current location
- Check skills and availability

### 5. Map Access
- **Volunteer Map**: See all volunteer locations
- **Victim Map**: See all request locations
- Direct integration with existing maps

## API Endpoints

### POST `/api/admin/login`
**Login admin user**

Request:
```json
{
  "adminid": "admin",
  "password": "admin123"
}
```

Response:
```json
{
  "message": "Admin login successful",
  "token": "jwt_token_here",
  "admin": {
    "id": 1,
    "adminid": "admin",
    "name": "System Administrator",
    "email": "admin@rescueconnect.com"
  }
}
```

### GET `/api/admin/dashboard`
**Fetch dashboard data**

Headers:
```
Authorization: Bearer {token}
```

Response:
```json
{
  "requests": [...],
  "volunteers": [...],
  "stats": {
    "total_volunteers": 10,
    "pending_requests": 5,
    "emergency_requests": 2,
    "requests_today": 8
  }
}
```

### DELETE `/api/admin/dashboard?requestId={id}`
**Delete a request (admin only)**

Headers:
```
Authorization: Bearer {token}
```

Response:
```json
{
  "message": "Request deleted successfully",
  "request": {...}
}
```

## Security Features

### 1. Authentication
- JWT-based authentication
- Secure token storage in localStorage
- Auto-redirect on unauthorized access
- Token expiration (7 days)

### 2. Authorization
- Role-based access control
- Admin role verification on all routes
- Protected API endpoints
- Middleware authentication

### 3. Password Security
- Bcrypt hashing (10 rounds)
- No plain text passwords
- Secure password comparison

## Usage Instructions

### For Admins:

1. **Login**
   - Navigate to `/adminlogin`
   - Enter Admin ID: `admin`
   - Enter Password: `admin123`
   - Click "Login to Dashboard"

2. **Dashboard Navigation**
   - View statistics on overview page
   - Click tabs to switch views
   - Use action buttons for management

3. **View Requests**
   - Click "Requests" tab
   - See all requests with details
   - Click map icon to view location
   - Click delete icon to remove request

4. **Monitor Volunteers**
   - Click "Volunteers" tab
   - See all volunteers with status
   - Check last login times
   - View volunteer locations

5. **Access Maps**
   - Click "Volunteer Map" button
   - Click "Victim Map" button
   - View real-time locations
   - Monitor active situations

6. **Logout**
   - Click logout button in header
   - Redirects to admin login

## File Structure

```
src/
├── app/
│   ├── adminlogin/
│   │   └── page.js           # Admin login page
│   ├── admindashboard/
│   │   └── page.js           # Admin dashboard
│   └── api/
│       └── admin/
│           ├── login/
│           │   └── route.js  # Login API
│           └── dashboard/
│               └── route.js  # Dashboard API
├── create-admin.mjs          # Admin creation script
└── create-admin-table.sql    # SQL setup script
```

## Environment Variables

Required in `.env.local`:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
```

## Testing

### 1. Login Test
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"adminid":"admin","password":"admin123"}'
```

### 2. Dashboard Test
```bash
curl http://localhost:3000/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Delete Request Test
```bash
curl -X DELETE "http://localhost:3000/api/admin/dashboard?requestId=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Deployment

### 1. Database Setup
```bash
# Run SQL script
psql $DATABASE_URL < create-admin-table.sql

# Or create admin via script
node create-admin.mjs
```

### 2. Verify Tables
```sql
SELECT * FROM admins;
```

### 3. Test Login
- Navigate to `/adminlogin`
- Login with credentials
- Verify dashboard access

## Troubleshooting

### Login Issues
- Check database connection
- Verify admin exists: `SELECT * FROM admins WHERE adminid = 'admin'`
- Check password hash is correct
- Verify JWT_SECRET is set

### Dashboard Not Loading
- Check authentication token
- Verify API endpoints are working
- Check browser console for errors
- Verify database queries

### Authorization Errors
- Token may be expired (>7 days)
- Role may not be 'admin'
- Token may be invalid
- Login again to get new token

## Security Best Practices

1. ✅ Change default password immediately
2. ✅ Use strong passwords (12+ characters)
3. ✅ Keep JWT_SECRET secure and random
4. ✅ Use HTTPS in production
5. ✅ Rotate tokens regularly
6. ✅ Monitor admin access logs
7. ✅ Limit admin accounts
8. ✅ Enable 2FA (future enhancement)

## Future Enhancements

Consider adding:
1. Multiple admin roles (super admin, moderator)
2. Activity logs and audit trail
3. Admin notifications
4. Request assignment by admin
5. Volunteer management (approve/reject)
6. Export data functionality
7. Analytics and reports
8. Two-factor authentication
9. Password reset functionality
10. Admin profile management

---

**Status**: ✅ Complete  
**Created**: October 9, 2025  
**Version**: 1.0
