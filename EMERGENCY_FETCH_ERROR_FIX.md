# Emergency Button Fetch Error Fix

## Problem Description
**Error**: `fetch failed` occurring in `handleEmergencyRequest` function  
**Symptom**: Email was being sent successfully, but the operation failed with a fetch error  
**Location**: Frontend volunteer dashboard, Emergency button click handler

## Root Cause Analysis

The issue was caused by the server-side API route trying to use `fetch()` to call another internal API route (`/api/staff/alerts`). This created several problems:

1. **Server-Side Fetch Issues**: In Next.js API routes, using `fetch()` to call internal routes can be problematic
2. **URL Resolution**: The `NEXT_PUBLIC_BASE_URL` environment variable might not be properly configured
3. **Network Errors**: Server-to-server fetch can fail in various deployment environments
4. **Error Propagation**: When the alerts fetch failed, it caused the entire operation to fail

## Solution Implemented

### 1. **Replaced Fetch with Direct Database Calls**
Instead of calling the `/api/staff/alerts` route via fetch, we now execute the alert logic directly:

```javascript
// OLD (Problematic):
const alertResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/staff/alerts`, {
  method: 'POST',
  body: JSON.stringify({...})
});

// NEW (Fixed):
// Find nearby volunteers directly with SQL query
const nearbyVolunteersQuery = `...`;
const nearbyVolunteersResult = await client.query(nearbyVolunteersQuery, [...]);

// Insert alerts directly into database
const insertAlertQuery = `...`;
await client.query(insertAlertQuery, [...]);
```

### 2. **Added Try-Catch for Alert Logic**
Wrapped the entire alert-sending logic in a try-catch block to ensure it doesn't fail the main operation:

```javascript
try {
  // Find nearby volunteers and send alerts
  // ... alert logic ...
  console.log(`Alerts sent to ${nearbyVolunteers.length} nearby volunteers`);
} catch (alertError) {
  console.error('Error sending alerts:', alertError.message);
  // Continue execution - don't fail if alerts fail
}
```

### 3. **Improved Error Handling in Backend**
Enhanced error handling in the PUT method:

```javascript
catch (error) {
  console.error('Error marking request as emergency:', error);
  console.error('Error stack:', error.stack);
  
  // Ensure client is released even on error
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
  }), { status: 500 });
}
```

### 4. **Enhanced Frontend Error Handling**
Improved the frontend to handle response parsing errors:

```javascript
const handleEmergencyRequest = async (requestId) => {
  try {
    const response = await fetch(...);

    // Try to parse response as JSON
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      throw new Error('Invalid response from server');
    }

    if (!response.ok) {
      throw new Error(data.error || 'Failed to report emergency');
    }

    // Check if operation was successful
    if (data.success !== false) {
      // Remove request from UI
      setRequests(prevRequests => 
        prevRequests.filter(req => req.id !== requestId)
      );
      setSuccess('Emergency alert sent...');
    }
  } catch (error) {
    console.error('Error reporting emergency:', error);
    setError(`Failed to report emergency: ${error.message}`);
  }
};
```

## Changes Made

### File: `/api/staff/volunteersdashboard/route.js` (PUT method)

#### Before:
- Used `fetch()` to call `/api/staff/alerts`
- Could fail if fetch URL was incorrect
- No error handling for alert failures

#### After:
- Direct database queries to find nearby volunteers
- Direct insertion of alerts into database
- Wrapped in try-catch to prevent failures
- Better error logging with stack traces
- Improved client connection management

### File: `/src/app/volunteersdashboard/page.js` (handleEmergencyRequest)

#### Before:
- Basic error handling
- No JSON parsing error handling
- Generic error messages

#### After:
- Try-catch for JSON parsing
- Checks `success` flag in response
- More specific error messages
- Better error logging

## SQL Query Used for Nearby Volunteers

```sql
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
```

**Explanation**:
- Calculates distance using Haversine formula
- Finds volunteers within 10 km radius
- Excludes the reporting volunteer
- Orders by distance (closest first)

## Testing Instructions

### Test Case 1: Normal Emergency Report
1. Login as volunteer
2. Accept a request
3. Click "Emergency" button
4. **Expected Results**:
   - ✅ Government email sent
   - ✅ Alerts saved to database
   - ✅ Nearby volunteers notified
   - ✅ Request deleted from database
   - ✅ Request removed from UI
   - ✅ Success message displayed
   - ✅ No fetch errors

### Test Case 2: No Nearby Volunteers
1. Create request in isolated location
2. Accept and click "Emergency"
3. **Expected Results**:
   - ✅ Government email sent
   - ✅ Log: "No nearby volunteers found"
   - ✅ Request still deleted
   - ✅ Operation succeeds

### Test Case 3: Database Alert Insert Fails
1. Simulate database error (e.g., alerts table issue)
2. Click "Emergency" button
3. **Expected Results**:
   - ✅ Error logged to console
   - ✅ Government email still sent
   - ✅ Request still deleted
   - ✅ Operation doesn't fail completely

### Test Case 4: Email Sending Fails
1. Configure invalid email credentials
2. Click "Emergency" button
3. **Expected Results**:
   - ❌ Email fails (expected)
   - ✅ Error caught and logged
   - ✅ Operation continues
   - ✅ Alerts still sent to volunteers

## Monitoring & Debugging

### Server-Side Logs to Check:
```
✅ "Emergency email sent to [email]"
✅ "Alerts sent to X nearby volunteers"
✅ Request deleted successfully
```

### Error Logs to Watch:
```
⚠️ "Error sending alerts to nearby volunteers"
⚠️ "No nearby volunteers found within 10 km"
⚠️ "Error marking request as emergency"
```

### Frontend Console Logs:
```
✅ Response parsed successfully
✅ Request removed from UI
⚠️ "Error parsing response"
⚠️ "Failed to report emergency: [error]"
```

## Benefits of This Fix

1. ✅ **No More Fetch Errors**: Direct database calls eliminate fetch issues
2. ✅ **Better Performance**: No unnecessary HTTP round-trips
3. ✅ **Improved Reliability**: Failures in one part don't break the whole operation
4. ✅ **Better Error Messages**: More specific error reporting for debugging
5. ✅ **Graceful Degradation**: Email sent even if alerts fail
6. ✅ **Proper Resource Management**: Database connections properly released
7. ✅ **Better Logging**: Detailed error logs for troubleshooting

## Environment Variables Required

```env
# Email Configuration (Required)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
GOVERNMENT_EMAIL=government@example.com

# JWT Secret (Required)
JWT_SECRET=your-jwt-secret

# Base URL (Not required anymore after fix)
# NEXT_PUBLIC_BASE_URL=http://localhost:3001
```

## Database Requirements

### Tables Used:
1. **requests** - Emergency requests
2. **volunteers** - Volunteer information with lat/long
3. **alerts** - Emergency alerts
4. **alert_recipients** - Volunteers who receive alerts

### Required Columns:
```sql
-- volunteers table
- id (integer)
- name (varchar)
- contact (varchar)
- lat (decimal)
- long (decimal)

-- alerts table
- id (serial)
- latitude (decimal)
- longitude (decimal)
- message (text)
- timestamp (timestamptz)
- created_at (timestamptz)

-- alert_recipients table
- alert_id (integer)
- volunteer_id (integer)
- name (varchar)
- contact (varchar)
```

## Known Limitations

1. **Distance Calculation**: Uses Haversine formula (good for short distances, less accurate for long distances)
2. **Alert Delivery**: Alerts are saved to database but actual SMS/push notifications need separate implementation
3. **Concurrent Operations**: Multiple emergency reports at same time might create multiple alerts
4. **No Retry Logic**: If alert insertion fails, it won't retry (by design - graceful failure)

## Future Improvements

Consider implementing:
1. **Background Job Queue**: Process alerts asynchronously
2. **Actual SMS/Email Alerts**: Integrate with MSG91 or Twilio for real SMS
3. **Push Notifications**: Use Firebase or OneSignal for mobile alerts
4. **Retry Logic**: Retry failed alert insertions with exponential backoff
5. **Alert Deduplication**: Prevent duplicate alerts for same incident
6. **Distance Optimization**: Use PostGIS ST_DWithin for better performance
7. **Alert Templates**: Customizable alert message templates

---

**Fix Date**: October 8, 2025  
**Status**: ✅ Resolved  
**Severity**: High → None  
**Impact**: Emergency alerts now work reliably without fetch errors
