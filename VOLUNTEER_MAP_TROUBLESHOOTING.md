# Volunteer Map Troubleshooting Guide

## Issue: "Failed to fetch volunteers" error

### Step 1: Check Database Structure
1. Make sure dev server is running: `npm run dev`
2. Open browser and go to: `http://localhost:3000/api/test-db`
3. You should see JSON with two sections:
   - `columns`: Shows all columns in volunteers table
   - `volunteers`: Shows current volunteer data

**Expected columns should include:**
- `id`
- `name`
- `contact`
- `lat` (DOUBLE PRECISION)
- `long` (DOUBLE PRECISION)
- `status`
- `last_login`

### Step 2: Add Missing Columns (if needed)
If `lat` and `long` columns are missing:

1. Connect to your database (Neon dashboard or psql)
2. Run the migration script: `add-location-columns.sql`

OR manually run:
```sql
ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS long DOUBLE PRECISION;
```

### Step 3: Test Volunteer Map
1. Go to: `http://localhost:3000/volunteermap`
2. Open browser console (F12 → Console tab)
3. Look for detailed logs:
   ```
   === FETCHING VOLUNTEERS ===
   API URL: /api/volunteers
   Response received:
   - Status: 200
   - Status Text: OK
   - OK: true
   ```

### Step 4: Add Location Data to Volunteer
The map needs at least one volunteer with location data.

**Option A: Login with location**
1. Go to: `http://localhost:3000/login`
2. Click "Get Current Location" button (blue box)
3. Allow browser location permission
4. Wait for green checkmark showing coordinates
5. Login with your volunteer credentials
6. Check console for: "Location updated successfully"

**Option B: Manual database update**
```sql
UPDATE volunteers 
SET lat = 17.7514, long = 75.9695, status = 'available'
WHERE id = 27;  -- Replace with your volunteer ID
```

### Step 5: Verify Data Storage
After login, check:
1. Go to: `http://localhost:3000/api/test-db`
2. Look at the `volunteers` array
3. Verify your volunteer has non-null `lat` and `long` values

### Step 6: Refresh Map
1. Go to: `http://localhost:3000/volunteermap`
2. Check console logs for:
   ```
   Total volunteers: X, Valid with locations: Y
   ```
3. You should see markers on the map centered around Solapur

## Common Issues

### Error: "Authentication required"
- **Cause**: Token check was removed, this should not appear anymore
- **Fix**: Refresh the page

### Error: "Server returned 500"
- **Cause**: Database connection issue or query error
- **Fix**: Check database credentials in `.env.local`
- **Check**: Look at server console (terminal running npm run dev)

### No markers on map but no error
- **Cause**: No volunteers have location data
- **Fix**: Follow Step 4 above to add location data

### Location button doesn't work
- **Cause 1**: Browser doesn't support geolocation
- **Fix**: Use modern browser (Chrome, Edge, Firefox)

- **Cause 2**: Running on HTTP instead of HTTPS in production
- **Fix**: Geolocation requires HTTPS (except localhost)

- **Cause 3**: Location permission denied
- **Fix**: Click the icon in address bar to reset permissions

### Map shows wrong region
- Current center: Solapur, India (17.7514, 75.9695)
- Zoom level: 10 (covers ~100km radius)
- If you need different region, edit `volunteermap/page.js` line ~35:
  ```javascript
  const mapCenter = [YOUR_LAT, YOUR_LNG];
  const defaultZoom = 10;
  ```

## API Endpoints Reference

- **GET /api/volunteers** - Fetch all volunteers with locations
  - Returns: Array of volunteer objects
  - No authentication required
  - Filters out volunteers without lat/long

- **POST /api/staff/login** - Volunteer login
  - Body: `{ contact, password, latitude, longitude }`
  - Stores location in database
  - Returns JWT token

- **POST /api/staff/update-location** - Update volunteer location
  - Body: `{ latitude, longitude }`
  - Requires JWT token in Authorization header
  - Updates lat/long in database

## Database Schema

```sql
CREATE TABLE volunteers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    contact VARCHAR(255) UNIQUE,
    password TEXT,
    skills TEXT,
    certifications TEXT,
    status VARCHAR(50) DEFAULT 'offline',
    lat DOUBLE PRECISION,
    long DOUBLE PRECISION,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Still Having Issues?

Check these files for any manual edits needed:
1. `lib/db.js` - Database connection
2. `src/app/api/volunteers/route.js` - API endpoint
3. `src/app/volunteermap/page.js` - Frontend map component
4. `.env.local` - Database credentials

Look at the browser console AND terminal console for complete error messages.
