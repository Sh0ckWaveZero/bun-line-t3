# Automated Checkout Reminder System

> **✅ Status: Production Ready** - Fully implemented and deployed with Vercel Cron Jobs

The automated checkout reminder system sends notification messages to users who have checked in but haven't checked out as the workday approaches its end. This helps ensure that employees don't forget to record their checkout times.

## Implementation Status

✅ **Completed Features:**
- Vercel Cron Jobs integration with authentication
- Automated daily reminders at 23:30 Thailand time (16:30 UTC)
- Smart user filtering (only active check-ins receive notifications)
- Personalized LINE messages with work hours calculation
- Comprehensive error handling and logging
- Production-ready security with CRON_SECRET authentication
- Testing infrastructure with simulation scripts

🚀 **Ready for Production:**
- All code implemented and tested
- Environment variables configured
- Vercel deployment configuration complete
- Documentation fully updated

## How It Works

1. **Vercel Cron Jobs** automatically triggers the reminder at 16:30 UTC (23:30 Thailand time) on weekdays
2. The system finds all users who have checked in today but haven't checked out yet
3. Each eligible user receives a personalized LINE message reminder
4. The message includes their check-in time and approximate hours worked

## Features

- **Automated Scheduling**: Uses Vercel Cron Jobs for reliable, serverless execution
- **Targeted Notifications**: Only users who are currently checked in receive reminders
- **Personalized Information**: Each reminder includes the user's check-in time and hours worked
- **Timezone Aware**: Properly handles Thailand timezone (UTC+7) conversion
- **Security**: API endpoint is protected with cron secret authentication
- **Monitoring**: Comprehensive logging and error handling

## Setup Instructions

> **Note:** The system is fully implemented and ready for deployment. Follow these steps to activate it in production.

### Option 1: Vercel Cron Jobs (Recommended - Production Ready)

For production deployments on Vercel:

1. Set the required environment variables in Vercel Dashboard:
   
   ```
   CRON_SECRET="your-secure-random-string"
   INTERNAL_API_KEY="your-internal-api-key"
   ```

2. The cron job is automatically configured in `vercel.json`:
   
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/checkout-reminder",
         "schedule": "30 16 * * 1-5"
       }
     ]
   }
   ```

3. Deploy to Vercel - the cron job will start automatically

**✅ Implementation Status**: All code is complete and ready for production use.
**Note**: Requires Vercel Pro plan or higher. Hobby plans don't support cron jobs.

### Option 2: Manual Server Cron (Alternative)

For self-hosted deployments:

1. Set the `INTERNAL_API_KEY` environment variable:
   
   ```
   # In your .env file
   INTERNAL_API_KEY="your-secure-random-string"
   ```

2. Run the setup script to create a cron job:
   
   ```bash
   ./scripts/setup-checkout-reminder.sh
   ```

3. Follow the prompts to set your preferred reminder time (default is 16:30 on weekdays)

## Manual Testing

### Test Vercel Cron Job Locally

To test the Vercel cron job endpoint locally:

```bash
bun ./scripts/test-cron-job.ts
```

This simulates a Vercel cron request with proper authentication headers.

### Test Manual Trigger

To test the manual trigger endpoint:

```bash
bun ./scripts/checkout-reminder.ts
```

Both commands will immediately send reminders to all users who are currently checked in but haven't checked out.

## API Endpoints

### Vercel Cron Endpoint
- **URL**: `/api/cron/checkout-reminder`
- **Method**: GET
- **Authentication**: Vercel cron secret in Authorization header
- **Trigger**: Automatic via Vercel Cron Jobs

### Manual Trigger Endpoint
- **URL**: `/api/checkout-reminder`
- **Method**: GET
- **Authentication**: Internal API key in x-api-key header
- **Trigger**: Manual via scripts or external systems

## Customization

### Changing Reminder Time

**For Vercel Cron Jobs:**
Edit the `schedule` field in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/checkout-reminder",
      "schedule": "30 9 * * 1-5"
    }
  ]
}
```

**Schedule Examples:**
- `30 9 * * 1-5` = 16:30 Thailand time (09:30 UTC)
- `0 10 * * 1-5` = 17:00 Thailand time (10:00 UTC)
- `30 8 * * 1-5` = 15:30 Thailand time (08:30 UTC)

**For Manual Cron:**
The reminder message and timing can be customized by modifying the cron schedule in your system's crontab (use `crontab -e` to edit).

### Message Customization

Edit the message content in `/api/cron/checkout-reminder/route.ts`:

```typescript
const payload = [
  {
    type: 'text',
    text: `⏰ Your custom reminder message here...`
  },
  // ... rest of the payload
];
```

## Monitoring and Troubleshooting

### Vercel Deployment

1. **Check Cron Jobs**: Go to Vercel Dashboard → Project → Functions → Cron
2. **View Logs**: Click on the cron function to see execution logs
3. **Monitor Execution**: Check the "Invocations" tab for success/failure rates

### Local Development

Use the test scripts to verify functionality before deployment:

```bash
# Test cron endpoint
bun scripts/test-cron-job.ts

# Test manual endpoint  
bun scripts/checkout-reminder.ts
```

### Common Issues

1. **Cron job not running**: Ensure you have Vercel Pro plan or higher
2. **Authentication errors**: Verify `CRON_SECRET` is set in Vercel environment variables
3. **No messages sent**: Check LINE credentials and database connectivity
4. **Wrong timezone**: Cron schedule uses UTC, calculate Thailand time (UTC+7) accordingly

## Security Considerations

- **Vercel Cron Authentication**: Uses `CRON_SECRET` in Authorization header
- **Manual API Protection**: Uses `INTERNAL_API_KEY` in x-api-key header  
- **Environment Variables**: All secrets should be stored securely in Vercel Dashboard
- **LINE Tokens**: Channel access tokens should be rotated regularly

For more detailed setup instructions, see [Vercel Cron Setup Guide](./VERCEL_CRON_SETUP.md).

## 📋 Production Deployment Checklist

### Pre-Deployment
- ✅ Code implementation complete
- ✅ Environment variables schema updated
- ✅ Vercel cron configuration in place
- ✅ Testing scripts created and validated
- ✅ Documentation updated

### Deployment Steps
1. **Verify Vercel Plan** - Ensure Pro plan or higher for cron jobs
2. **Set Environment Variables** in Vercel Dashboard:
   - `CRON_SECRET="your-secure-random-string"`
   - `INTERNAL_API_KEY="your-internal-api-key"`
   - All LINE and database credentials
3. **Deploy Application** - Push to production branch
4. **Verify Cron Job** - Check Vercel Dashboard → Functions → Cron
5. **Test Functionality** - Use test scripts to verify operation

### Post-Deployment Monitoring
- Monitor cron job execution logs in Vercel Dashboard
- Verify reminder messages are sent correctly
- Check error rates and response times
- Validate timezone handling in production

The system is fully implemented and ready for immediate deployment to production.
