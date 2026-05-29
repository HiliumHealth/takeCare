# Medication Push Notifications - Testing & Implementation Guide

## Overview
The TakeCare system now includes automatic push notifications for medications:
1. **Immediate Notification**: When a doctor sends medications to a patient
2. **Scheduled Notifications**: At specific times when patient needs to take their medication

## Architecture

### Files Involved:
- `lib/notifications.ts` - Core push notification service
- `lib/reminders.ts` - Medication reminder scheduling and processing
- `lib/medication-scheduler.ts` - Medication time parsing utilities
- `app/api/doctor/submit-record/route.ts` - Doctor submits medications
- `app/api/cron/reminders/route.ts` - CRON job for scheduled reminders
- `app/api/test/medication-reminder/route.ts` - TEST endpoint

### Database Models:
- `User` - Has `pushSubscriptions` (one-to-many)
- `PushSubscription` - Stores browser push endpoints
- `Prescription` - Doctor's prescription, links to medications
- `Medication` - Individual medication with `times` array (e.g., ["08:00", "14:00"])

## Flow

### 1. Doctor Submits Medications
```
Doctor Dashboard (/doctor/dashboard/[inviteId])
↓
Doctor fills in medications with times
↓
POST /api/doctor/submit-record
↓
Create Prescription & Medications in DB
↓
Call sendPushNotification() → Patient gets notification
↓
Call scheduleMedicationReminders() → Logs the schedule
```

### 2. CRON Job Triggers Reminders
```
Every minute (via /api/cron/reminders or external cron)
↓
Check current time (HH:mm format)
↓
Find all medications with matching time
↓
Group by user to avoid duplicate notifications
↓
Send push notifications to patients
```

## Testing

### Option 1: Manual Testing with Test Endpoint

#### 1. Get a User ID
First, you need a user ID of a patient who has push notifications enabled.

#### 2. Send Test Notification
```
GET http://localhost:3001/api/test/medication-reminder?action=send-test&userId=[USER_ID]
```
Response:
```json
{
  "success": true,
  "message": "Test notification sent",
  "userId": "user123",
  "user": { "name": "John Doe", "email": "john@example.com" },
  "result": [...]
}
```

#### 3. Create & Trigger Test Reminder (Immediate)
```
GET http://localhost:3001/api/test/medication-reminder?action=create-test-reminder&userId=[USER_ID]
```
This will:
- Create a prescription with medication scheduled for RIGHT NOW
- Immediately trigger the CRON job
- Patient should receive notification

#### 4. List Medications Due Now
```
GET http://localhost:3001/api/test/medication-reminder?action=list-due-medications
```
Shows all medications that should send notifications at current time.

#### 5. Process Medication Queue Manually
```
GET http://localhost:3001/api/test/medication-reminder?action=process-queue
```
This manually triggers the CRON job to check and send reminders.

### Option 2: Full Integration Testing

#### Step 1: Doctor Submits Medications
1. Navigate to `http://localhost:3001/doctor/dashboard/[inviteId]`
2. Fill in medications with times like:
   - Medication 1: 08:00, 14:00, 20:00
   - Medication 2: 09:00, 21:00
3. Submit form
4. **Expected**: Patient receives push: "New Doctor Assessment - Dr. [Name] has submitted your medical report..."

#### Step 2: Wait for Medication Time or Test
Option A: Wait until actual medication time
Option B: Use test endpoint to create reminder at current time

#### Step 3: Verify Notification
- Check browser notifications
- Browser console should show: `[CRON] Checking medication queue for time: HH:mm`
- Notification should appear: "Medication Reminder 💊 - Time for your medicine: [MedName] (Dosage)"

## CRON Job Setup (Production)

The CRON job needs to be called every minute. Options:

### Option 1: External CRON Service (Recommended)
Use services like:
- **Vercel Cron** (if deployed on Vercel)
- **EasyCron.com** - Free external CRON service
- **AWS EventBridge** or **GCP Cloud Scheduler**

Set to call: `GET {YOUR_URL}/api/cron/reminders`

### Option 2: In-App CRON (Not Recommended - Development Only)
For local testing, manually call the endpoint or use a browser console script:
```javascript
// Call every minute
setInterval(() => {
  fetch('/api/cron/reminders').then(r => r.json()).then(console.log);
}, 60000);
```

### Option 3: Secure CRON with Auth Header
Update `app/api/cron/reminders/route.ts`:
```typescript
const authHeader = req.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response('Unauthorized', { status: 401 });
}
```

## Push Notification Prerequisites

### Browser Requirements:
- Modern browser with Service Worker support
- User must grant push notification permission
- User must have active push subscription

### Backend Requirements:
- VAPID keys configured in `.env.local`:
  ```
  NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
  VAPID_PRIVATE_KEY=...
  ```
- `PushSubscription` records in database for users

### Frontend Requirements:
- `use-push-notifications.ts` hook must be used to subscribe user
- Service Worker (`public/sw.js`) must be active

## Troubleshooting

### No Notifications Received?

1. **Check Push Subscription exists**:
   - Database should have `PushSubscription` record for user
   - Verify endpoint is not expired

2. **Check VAPID Keys**:
   - `echo $VAPID_PRIVATE_KEY` in terminal
   - Keys must be valid and properly formatted

3. **Check Browser Permissions**:
   - User must grant notification permission
   - Check browser settings for notification permission

4. **Check CRON Job**:
   - Manually call `/api/cron/reminders` and check response
   - Verify medications are in database with correct times

5. **Browser Console Logs**:
   - Open DevTools → Console
   - Look for `[Push Send]`, `[Medication Reminder]`, `[CRON]` logs
   - Check for any error messages

### Notifications Not Sent at Specific Times?

1. **Check Timezone**: System uses UTC/server timezone
2. **Check Time Format**: Should be HH:mm (24-hour format)
3. **Call Test Endpoint**: Use `?action=create-test-reminder` to test

## Example: Full Testing Workflow

```bash
# 1. Terminal: Start dev server
cd frontend && npm run dev

# 2. Browser: Open dashboard and enable push notifications
# http://localhost:3001/dashboard

# 3. Terminal: Get the user ID from database or from session
# You can find it in network tab of DevTools

# 4. Browser: Test notification
# http://localhost:3001/api/test/medication-reminder?action=send-test&userId=USER_ID

# 5. Browser: Create test reminder (medication due NOW)
# http://localhost:3001/api/test/medication-reminder?action=create-test-reminder&userId=USER_ID

# 6. Verify: Check for browser notification
# Should see: "Medication Reminder 💊"
```

## Important Notes

1. **Time Format**: All medication times are in 24-hour format (HH:mm)
2. **Database**: Medication `times` is a String[] array in database
3. **Aggregation**: If multiple meds due at same time, they're combined in one notification
4. **Invalid Subscriptions**: Automatically cleaned up if endpoint returns 410 (expired)
5. **Notifications require HTTPS** in production (localhost works in development)

## Next Steps

1. ✅ Deploy to production
2. ✅ Set up CRON job with external service
3. ✅ Configure VAPID keys in production .env
4. ✅ Monitor push delivery logs
5. ✅ Set up alerts for failed notifications
