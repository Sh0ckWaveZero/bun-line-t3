#!/usr/bin/env zsh

# setup-checkout-reminder.sh
# Script to set up a cron job for automated checkout reminders
# This should be run with appropriate permissions

set -e

# Get the absolute path where this script is located
SCRIPT_DIR=$(cd "$(dirname "${0}")" && pwd)
PROJECT_ROOT="${SCRIPT_DIR}/.."

# Define script paths
CHECKOUT_REMINDER_SCRIPT="${PROJECT_ROOT}/scripts/checkout-reminder.ts"

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Error: bun is not installed. Please install bun first."
    exit 1
fi

# Make the checkout reminder script executable
chmod +x "${CHECKOUT_REMINDER_SCRIPT}"
echo "✅ Made checkout reminder script executable"

# Define the time when the reminder should run (default: 16:30 on weekdays)
DEFAULT_HOUR=16
DEFAULT_MINUTE=30

# Ask user for confirmation or custom time
echo "ℹ️  This script will set up an automatic checkout reminder"
echo "   The default time is ${DEFAULT_HOUR}:${DEFAULT_MINUTE} on weekdays (Mon-Fri)"

read -p "Do you want to use this default time? (y/n): " USE_DEFAULT
if [[ "${USE_DEFAULT}" != "y" && "${USE_DEFAULT}" != "Y" ]]; then
    read -p "Enter hour (0-23): " HOUR
    read -p "Enter minute (0-59): " MINUTE
    
    # Validate input
    if ! [[ "${HOUR}" =~ ^[0-9]+$ && "${MINUTE}" =~ ^[0-9]+$ ]]; then
        echo "❌ Error: Invalid time format. Please enter numbers only."
        exit 1
    fi
    
    if [[ "${HOUR}" -lt 0 || "${HOUR}" -gt 23 || "${MINUTE}" -lt 0 || "${MINUTE}" -gt 59 ]]; then
        echo "❌ Error: Invalid time values. Hours must be 0-23, minutes 0-59."
        exit 1
    fi
else
    HOUR="${DEFAULT_HOUR}"
    MINUTE="${DEFAULT_MINUTE}"
fi

# Create the cron job entry
CRON_ENTRY="${MINUTE} ${HOUR} * * 1-5 ${CHECKOUT_REMINDER_SCRIPT}"

# Add to crontab (temporary file approach for safety)
TEMP_CRONTAB=$(mktemp)
crontab -l > "${TEMP_CRONTAB}" 2>/dev/null || echo "# New crontab" > "${TEMP_CRONTAB}"

# Check if the entry already exists
if grep -Fq "${CHECKOUT_REMINDER_SCRIPT}" "${TEMP_CRONTAB}"; then
    echo "⚠️  Warning: Checkout reminder cron job already exists."
    read -p "Do you want to replace it? (y/n): " REPLACE
    
    if [[ "${REPLACE}" == "y" || "${REPLACE}" == "Y" ]]; then
        # Remove existing entry and add new one
        grep -v "${CHECKOUT_REMINDER_SCRIPT}" "${TEMP_CRONTAB}" > "${TEMP_CRONTAB}.new"
        mv "${TEMP_CRONTAB}.new" "${TEMP_CRONTAB}"
        echo "${CRON_ENTRY}" >> "${TEMP_CRONTAB}"
        
        # Install the new crontab
        crontab "${TEMP_CRONTAB}"
        echo "✅ Updated cron job to run at ${HOUR}:${MINUTE} on weekdays"
    else
        echo "ℹ️  Keeping existing cron job"
    fi
else
    # No existing entry, add new one
    echo "${CRON_ENTRY}" >> "${TEMP_CRONTAB}"
    
    # Install the new crontab
    crontab "${TEMP_CRONTAB}"
    echo "✅ Added cron job to run at ${HOUR}:${MINUTE} on weekdays"
fi

# Clean up
rm "${TEMP_CRONTAB}"

echo "
🎉 Automatic checkout reminder has been set up successfully! 🎉
   Users who have checked in but haven't checked out will receive
   a LINE notification at ${HOUR}:${MINUTE} every weekday.
   
   To test the reminder, run:
   $ ${CHECKOUT_REMINDER_SCRIPT}
"
