# Volunteer Location Tracking Feature

## Overview
This feature automatically captures and updates volunteer locations for real-time tracking on the volunteer map.

## How It Works

### 1. **Login Location Capture**
When a volunteer logs in through `/login`:
- Browser requests location permission
- Current GPS coordinates are captured
- Location is sent with login credentials
- Database is updated with current location
- Volunteer status is set to "available"

### 2. **Periodic Location Updates**
While on the Volunteers Dashboard:
- Location is updated every 5 minutes automatically
- Uses cached location (valid for 1 minute) for efficiency
- Updates happen in the background
- No user interaction required

### 3. **Location Storage**
The system supports two storage methods:

#### **Method A: PostGIS (Recommended)**
```sql
location GEOGRAPHY(POINT, 4326)
```
- Uses PostGIS spatial data types
- More efficient for distance calculations
- Supports advanced geographic queries

#### **Method B: Simple Columns (Fallback)**
```sql
latitude NUMERIC(10, 8)
longitude NUMERIC(11, 8)
```
- Standard numeric columns
- Works without PostGIS extension
- Easy to query and update

The system automatically tries PostGIS first, then falls back to simple columns if PostGIS is not available.

## API Endpoints

### 1. **POST /api/staff/login**
Login with automatic location capture.

**Request:**
```json
{
  "contact": "volunteer@example.com",
  "password": "password123",
  "latitude": 19.0760,
  "longitude": 72.8777
}
```

**Response:**
```json
{
  "message": "Login successful.",
  "token": "jwt-token-here",
  "volunteer": {
    "id": 1,
    "name": "John Doe",
    "contact": "volunteer@example.com",
    ...
  }
}
```

### 2. **POST /api/staff/update-location**
Update volunteer location (authenticated).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request:**
```json
{
  "latitude": 19.0760,
  "longitude": 72.8777
}
```

**Response:**
```json
{
  "message": "Location updated successfully",
  "latitude": 19.0760,
  "longitude": 72.8777
}
```

### 3. **GET /api/volunteers**
Get all volunteers with locations.

**Response:**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "contact": "+1234567890",
    "skills": "First Aid, Search & Rescue",
    "latitude": 19.0760,
    "longitude": 72.8777,
    "status": "available",
    "experience": "Experienced",
    "last_login": "2025-10-05T10:30:00Z"
  }
]
```

## Volunteer Status Values

| Status | Description | Color |
|--------|-------------|-------|
| `available` | Volunteer is online and ready | 🟢 Green |
| `busy` | Volunteer is handling a request | 🟡 Yellow |
| `offline` | Volunteer is logged out | ⚫ Gray |

## Database Schema

### Required Columns
```sql
-- Option 1: PostGIS (recommended)
ALTER TABLE volunteers ADD COLUMN location GEOGRAPHY(POINT, 4326);
ALTER TABLE volunteers ADD COLUMN status VARCHAR(20) DEFAULT 'offline';
ALTER TABLE volunteers ADD COLUMN last_login TIMESTAMP;

-- Option 2: Simple columns (fallback)
ALTER TABLE volunteers ADD COLUMN latitude NUMERIC(10, 8);
ALTER TABLE volunteers ADD COLUMN longitude NUMERIC(11, 8);
ALTER TABLE volunteers ADD COLUMN status VARCHAR(20) DEFAULT 'offline';
ALTER TABLE volunteers ADD COLUMN last_login TIMESTAMP;
ALTER TABLE volunteers ADD COLUMN experience VARCHAR(100);

-- Indexes for performance
CREATE INDEX idx_volunteers_location ON volunteers(latitude, longitude);
CREATE INDEX idx_volunteers_status ON volunteers(status);
```

## Migration

Run the provided migration script:

```bash
psql -U your_user -d your_database -f migration_volunteer_location.sql
```

Or execute the SQL directly in your database client.

## Frontend Implementation

### Location Permission Request
The browser will prompt users for location permission on first login. Users must allow location access for the feature to work.

### Privacy Considerations
- Location is only tracked when volunteer is logged in
- Location updates stop when volunteer logs out
- Location data is used only for rescue coordination
- Volunteers can see their location on the map

## Configuration

### Update Interval
Change the location update frequency in `volunteersdashboard/page.js`:

```javascript
// Update every 5 minutes (default)
const locationTimer = setInterval(updateLocation, 5 * 60 * 1000);

// Update every 2 minutes (more frequent)
const locationTimer = setInterval(updateLocation, 2 * 60 * 1000);

// Update every 10 minutes (less frequent)
const locationTimer = setInterval(updateLocation, 10 * 60 * 1000);
```

### Location Accuracy
Adjust accuracy settings in the geolocation options:

```javascript
{
  enableHighAccuracy: true,  // Use GPS for better accuracy
  timeout: 10000,            // Wait up to 10 seconds
  maximumAge: 60000          // Cache location for 1 minute
}
```

## Testing

### Test Location Capture
1. Log in as a volunteer
2. Allow location access when prompted
3. Check browser console for "Location captured: lat, lng"
4. Verify location appears in database

### Test Location Updates
1. Stay logged in to dashboard
2. Wait 5 minutes
3. Check console for "Location updated: lat, lng"
4. Verify database timestamp updates

### Test Volunteer Map
1. Log in as a user (victim)
2. Click "View Volunteers on Map" button
3. Verify volunteers appear with correct locations
4. Click "Get Directions" to test routing

## Troubleshooting

### Location Not Captured
- **Issue**: Browser doesn't request location
- **Solution**: Ensure HTTPS connection (required for geolocation API)
- **Solution**: Check browser location permissions in settings

### Database Update Fails
- **Issue**: PostGIS functions not found
- **Solution**: System automatically falls back to simple columns
- **Solution**: Check that latitude/longitude columns exist

### Volunteers Not Appearing on Map
- **Issue**: No volunteers with location data
- **Solution**: Volunteers must log in at least once to set location
- **Solution**: Check that volunteers table has location columns

## Security

- JWT authentication required for all location updates
- Volunteer ID extracted from JWT token (not from request body)
- Location coordinates validated before storage
- Failed location updates don't prevent login
- Location updates silently fail if permissions denied

## Future Enhancements

- [ ] Real-time location streaming with WebSocket
- [ ] Location history tracking
- [ ] Geofencing for disaster zones
- [ ] Battery-efficient location tracking
- [ ] Manual location override option
- [ ] Location sharing controls per volunteer
- [ ] Offline location caching
- [ ] Distance-based volunteer matching
