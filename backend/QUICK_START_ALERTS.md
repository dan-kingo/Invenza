# Quick Start Guide - Alerts & Notifications

## Setup

1. Ensure .env file has SMTP configuration for email alerts:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

2. Start the server - scheduler runs automatically:
```bash
npm run dev
```

## Testing the System

### 1. Register a Device for Push Notifications
```bash
curl -X POST http://localhost:5000/api/devices/register \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "platform": "ios",
    "deviceId": "device123"
  }'
```

### 2. Create an Item with Low Threshold
```bash
curl -X POST http://localhost:5000/api/items \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Item",
    "quantity": 5,
    "minThreshold": 10,
    "unit": "pcs"
  }'
```
This will create a low stock alert automatically.

### 3. Adjust Quantity Below Threshold
```bash
curl -X POST http://localhost:5000/api/items/ITEM_ID/adjust \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "delta": -3,
    "action": "sold",
    "reason": "Customer purchase"
  }'
```

### 4. Check Alerts
```bash
curl http://localhost:5000/api/alerts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Check Notifications
```bash
curl http://localhost:5000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. Get Unread Count
```bash
curl http://localhost:5000/api/notifications/unread-count \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 7. Mark Notification as Read
```bash
curl -X PUT http://localhost:5000/api/notifications/NOTIFICATION_ID/read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 8. Resolve Alert (Owner/Admin only)
```bash
curl -X PUT http://localhost:5000/api/alerts/ALERT_ID/resolve \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 9. Manual Threshold Check (Owner/Admin only)
```bash
curl -X POST http://localhost:5000/api/alerts/check \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Alert Triggers

Alerts are automatically created when:
- Creating an item with quantity <= minThreshold
- Adjusting quantity to or below minThreshold
- Quantity reaches zero (out of stock)
- Item expiring within 7 days (daily check at 8 AM)
- Hourly scheduled check finds threshold breaches

## Notification Delivery

- **In-app**: Always created, stored in database
- **Push**: Sent if device token registered
- **Email**: Only for critical severity alerts

## Alert Severity Levels

- `info` - Informational alerts
- `warning` - Low stock warnings
- `critical` - Out of stock, near expiry (2 days)

## Alert Types

- `low_stock` - Quantity at or below threshold
- `out_of_stock` - Quantity is zero
- `expiry_warning` - Item expiring soon
- `critical` - High priority issues

## Scheduled Tasks

### Hourly Check (every hour at :00)
- Checks all items against thresholds
- Creates alerts for breached items
- Check server logs: "Running hourly threshold check..."

### Daily Check (8:00 AM)
- Checks items expiring in 7 days
- Creates expiry warnings
- Check server logs: "Running daily expiry check..."

## Troubleshooting

### No push notifications received
1. Verify device token is valid Expo token
2. Check device is registered: `GET /api/devices/register`
3. Check notification was created: `GET /api/notifications`
4. Check server logs for Expo errors

### No email alerts
1. Verify SMTP credentials in .env
2. Check alert severity is "critical"
3. Check user has email address
4. Check server logs for email errors

### Scheduled tasks not running
1. Check server logs for scheduler messages
2. Verify server has been running for at least 1 hour
3. Check cron expressions in scheduler.service.ts

### Alerts not auto-resolving
1. Verify quantity is above minThreshold
2. Next threshold check will resolve it
3. Trigger manual check: `POST /api/alerts/check`

## Monitoring

Check server logs for:
- "Alert scheduler started" on startup
- "Running hourly threshold check..." every hour
- "Running daily expiry check..." at 8 AM daily
- "Threshold check completed" after successful runs
- Any error messages from scheduler

## Production Recommendations

1. Use environment variables for all sensitive data
2. Set up proper SMTP service (not Gmail for production)
3. Monitor scheduler logs
4. Set up alerts for failed deliveries
5. Regularly clean up old resolved alerts
6. Test push notifications with real devices
7. Configure rate limits for notification endpoints
