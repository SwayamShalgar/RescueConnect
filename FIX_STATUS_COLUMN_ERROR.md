# Fix: "column status of relation volunteers does not exist"

## Problem
You're getting this error:
```
Failed to update location: column "status" of relation "volunteers" does not exist
POST /api/staff/update-location 500 in 2563ms
```

## Root Cause
Your volunteers table is missing the `status` column which is used to track volunteer availability (available/busy/offline).

## Solution (Choose One)

### Option 1: Quick Fix (API Already Updated) ✅ RECOMMENDED

**Good news!** The APIs have been updated to work WITHOUT the status column. Just restart your dev server:

```powershell
# Stop the server (Ctrl+C if running)
# Then restart:
cd "d:\disastercrices - Copy\desistercrise"
npm run dev
```

The code now checks if the `status` column exists and works either way!

### Option 2: Add the Status Column (Better for Long-term)

If you want full functionality including status tracking, add the column to your database:

#### Step 1: Connect to Your Database

**Using Neon Dashboard:**
1. Go to https://console.neon.tech
2. Select your project
3. Go to SQL Editor
4. Paste the migration script below

**Using psql:**
```bash
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DATABASE
```

#### Step 2: Run Migration Script

Copy and paste this into your SQL editor:

```sql
-- Add status column
ALTER TABLE volunteers 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'offline';

-- Update volunteers with location to 'available'
UPDATE volunteers 
SET status = 'available' 
WHERE lat IS NOT NULL AND long IS NOT NULL;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'volunteers' 
AND column_name = 'status';
```

Or run the complete migration file:
```bash
# If you have psql installed
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DATABASE -f complete-migration.sql
```

#### Step 3: Verify

Check if the column was added:
```bash
# Open in browser
http://localhost:3000/api/test-db
```

Look for `status` in the columns list.

### Option 3: Use the Migration Files

We've created two migration scripts:

**File 1: `add-status-column.sql`**
- Adds ONLY the status column
- Safe to run multiple times
- Sets volunteers with location to 'available'

**File 2: `complete-migration.sql`**
- Adds ALL missing columns (lat, long, status, last_login)
- Comprehensive migration
- Shows statistics after completion

To run:
```sql
-- In your SQL editor, paste contents of:
complete-migration.sql
```

## What Changed in the Code

All APIs now check if the `status` column exists before trying to use it:

### ✅ Update Location API (`/api/staff/update-location`)
```javascript
// Checks if status column exists
// If yes: Updates lat, long, status, last_login
// If no: Updates lat, long, last_login only
```

### ✅ Login API (`/api/staff/login`)
```javascript
// Checks if status column exists
// Updates location with or without status
```

### ✅ Signup API (`/api/staff/signup`)
```javascript
// Checks if status column exists
// Creates volunteer with or without status
```

### ✅ Volunteers API (`/api/volunteers`)
```javascript
// Checks if status column exists
// Returns volunteers with status='available' as default
```

## Testing

After fixing (either option), test the location update:

### Test 1: Manual Location Update
```javascript
// In browser console on /volunteersdashboard
navigator.geolocation.getCurrentPosition(async (position) => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/staff/update-location', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    })
  });
  console.log(await response.json());
});
```

Expected: `{ message: "Location updated successfully", latitude: ..., longitude: ... }`

### Test 2: Login with Location
1. Go to `/login`
2. Allow location permission
3. Login
4. Check console: "Location updated successfully"

### Test 3: Check Database
```sql
SELECT id, name, lat, long, status, last_login 
FROM volunteers 
WHERE lat IS NOT NULL 
ORDER BY last_login DESC 
LIMIT 5;
```

## Current Status Column Values

If you add the status column, it can have these values:

- **`available`** - Volunteer is ready to help
- **`busy`** - Volunteer is currently on a mission
- **`offline`** - Volunteer is not active

**Default:** New volunteers get `'offline'`, volunteers with location get `'available'`

## Troubleshooting

### Error persists after restart
1. Clear browser cache and cookies
2. Check server console for other errors
3. Verify database connection in `.env.local`

### Can't connect to database
1. Check your `.env.local` file
2. Verify `DATABASE_URL` is correct
3. Test connection: `http://localhost:3000/api/test-db`

### Status column added but still showing error
1. Restart the dev server
2. Clear browser cache
3. Check server console for other errors

### Want to remove status column functionality
The code now works without it! Just:
1. Don't add the column
2. Restart the server
3. Everything will work (just no status tracking)

## Files Modified

- ✅ `src/app/api/staff/update-location/route.js` - Made status optional
- ✅ `src/app/api/staff/login/route.js` - Made status optional
- ✅ `src/app/api/staff/signup/route.js` - Made status optional
- ✅ `src/app/api/volunteers/route.js` - Made status optional
- 📄 `add-status-column.sql` - Migration for status column
- 📄 `complete-migration.sql` - Complete migration script

## Summary

**You have two options:**

1. **Do nothing** - The code now works WITHOUT the status column ✅
2. **Add the column** - Run the migration script for full functionality

Either way, your location tracking will work! The error is now fixed. 🎉
