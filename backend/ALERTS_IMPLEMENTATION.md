# Alerts & Notifications Implementation

This document describes the implementation of Phase 5: Alerts & Notifications system.

## Overview

The system provides automatic low-stock alerts with multi-channel notification delivery including push notifications (Expo), email alerts, and in-app notifications.

## Components

### Models

1. **Alert** (`src/models/Alert.ts`)
   - Tracks inventory alerts (low stock, out of stock, expiry warnings)
   - Fields: businessId, itemId, type, severity, message, currentQuantity, threshold, isResolved
   - Types: low_stock, out_of_stock, expiry_warning, critical
   - Severity levels: info, warning, critical

2. **Notification** (`src/models/Notification.ts`)
   - Stores user notifications with delivery status
   - Fields: userId, businessId, alertId, type, title, message, data, isRead, channels, sentVia
   - Supports multiple delivery channels: push, email, in_app
   - Tracks which channels successfully delivered

3. **DeviceToken** (`src/models/DeviceToken.ts`)
   - Manages Expo push notification tokens
   - Fields: userId, token, platform (ios/android/web), deviceId, isActive
   - Automatically deactivates invalid tokens

### Services

1. **AlertService** (`src/services/alert.service.ts`)
   - `checkItemThreshold()` - Checks single item against threshold and creates/resolves alerts
   - `createAlert()` - Creates new alert records
   - `sendAlertNotifications()` - Sends notifications to business owners/admins
   - `checkAllThresholds()` - Batch check all items (scheduled task)
   - `checkExpiringItems()` - Checks for items expiring within 7 days
   - `getBusinessAlerts()` - Retrieves alerts for a business
   - `resolveAlert()` - Marks alert as resolved

2. **NotificationService** (`src/services/notification.service.ts`)
   - `registerDeviceToken()` - Registers Expo push token for a user
   - `sendPushNotification()` - Sends push notification via Expo
   - `sendEmailNotification()` - Sends email notification via Nodemailer
   - `getUserNotifications()` - Gets user's notifications
   - `markAsRead()` - Marks notification as read
   - `markAllAsRead()` - Marks all user notifications as read
   - `deleteNotification()` - Deletes a notification
   - `getUnreadCount()` - Gets count of unread notifications

3. **SchedulerService** (`src/services/scheduler.service.ts`)
   - Runs periodic checks using node-cron
   - Hourly threshold checks (every hour)
   - Daily expiry checks (8:00 AM daily)
   - Graceful shutdown on SIGTERM/SIGINT

### Controllers

1. **DeviceController** (`src/controllers/device.controller.ts`)
   - `registerDevice()` - POST /api/devices/register

2. **NotificationController** (`src/controllers/notification.controller.ts`)
   - `getNotifications()` - GET /api/notifications
   - `markAsRead()` - PUT /api/notifications/:id/read
   - `markAllAsRead()` - PUT /api/notifications/read-all
   - `deleteNotification()` - DELETE /api/notifications/:id
   - `getUnreadCount()` - GET /api/notifications/unread-count

3. **AlertController** (`src/controllers/alert.controller.ts`)
   - `getAlerts()` - GET /api/alerts
   - `resolveAlert()` - PUT /api/alerts/:id/resolve
   - `triggerThresholdCheck()` - POST /api/alerts/check (manual trigger)

## Integration Points

### Item Controller Integration
- Alert checks are triggered automatically in:
  - `createItem()` - After creating an item with initial stock
  - `adjustQuantity()` - After any quantity adjustment

### Sync Service Integration
- Alert checks are triggered in:
  - `applyAdjustment()` - After applying quantity changes from sync operations

## Alert Flow

1. **Trigger**: Inventory event reduces item quantity
2. **Check**: `AlertService.checkItemThreshold()` compares quantity to minThreshold
3. **Alert Creation**: If threshold breached, create Alert document
4. **Notification Creation**: Create Notification for each owner/admin
5. **Delivery**:
   - In-app: Stored immediately
   - Push: Sent via Expo if device tokens exist
   - Email: Sent for critical alerts only
6. **Resolution**: Alert auto-resolves when quantity rises above threshold

## Notification Channels

### Push Notifications (Expo)
- Requires device registration via POST /api/devices/register
- Validates Expo push tokens
- Handles token invalidation automatically
- Supports high-priority delivery for critical alerts

### Email Notifications
- Used for critical alerts only
- Sent via Nodemailer (SMTP)
- Includes alert details and item information
- Requires SMTP configuration in .env

### In-App Notifications
- Always created for all alerts
- Stored in Notifications collection
- Supports read/unread status
- Can be deleted by users

## Scheduled Tasks

### Hourly Threshold Check
- Cron: `0 * * * *` (every hour at minute 0)
- Checks all items in database
- Creates alerts for any breached thresholds

### Daily Expiry Check
- Cron: `0 8 * * *` (daily at 8:00 AM)
- Checks items expiring within 7 days
- Creates expiry warning alerts
- Critical severity for items expiring in 2 days or less

## API Endpoints

### Device Management
- `POST /api/devices/register` - Register Expo push token
  - Body: { token, platform, deviceId? }

### Notifications
- `GET /api/notifications` - List user notifications
  - Query: limit, includeRead
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Alerts
- `GET /api/alerts` - List business alerts
  - Query: includeResolved
- `PUT /api/alerts/:id/resolve` - Resolve alert (owner/admin only)
- `POST /api/alerts/check` - Manual threshold check (owner/admin only)

## Security

- All endpoints require authentication
- Alert resolution restricted to owners/admins
- Users only see notifications for their businessId
- Device tokens tied to specific users
- Email addresses validated before sending

## Error Handling

- Invalid Expo tokens automatically deactivated
- Email failures logged but don't block alert creation
- Failed notifications tracked in sentVia array
- Scheduler errors logged but don't stop service

## Dependencies

- `expo-server-sdk` - Push notification delivery
- `node-cron` - Task scheduling
- `nodemailer` - Email delivery (already configured)

## Environment Variables

All required variables already exist in .env.example:
- SMTP settings (for email notifications)
- FRONTEND_URL (for email links)

No additional configuration needed.
