#!/bin/bash

# 🚀 Deploy OAuth Fix to Production
# Run this script to deploy the LINE OAuth fix

set -e

echo "🚀 Deploying LINE OAuth Fix..."
echo "=================================="

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

# If on fix branch, merge to main
if [[ "$CURRENT_BRANCH" == "fix/line-login-production" ]]; then
    echo ""
    echo "📦 Merging fix/line-login-production into main..."

    # Checkout main
    git checkout main

    # Pull latest main
    git pull origin main

    # Merge fix branch
    git merge fix/line-login-production -m "chore: merge LINE OAuth fix into main"

    # Push to trigger deployment
    git push origin main

    echo ""
    echo "✅ Deployment triggered! GitHub Actions will:"
    echo "   1. Build Docker image with the fix"
    echo "   2. Deploy to production server"
    echo "   3. Restart containers"
    echo ""
    echo "⏱️  Wait 5-10 minutes for deployment to complete..."
    echo "📊 Check deployment status at:"
    echo "   https://github.com/YOUR_USERNAME/bun-line-t3/actions"

else
    echo ""
    echo "⚠️  You're not on the fix branch."
    echo "   Run this script from fix/line-login-production branch"
    exit 1
fi
