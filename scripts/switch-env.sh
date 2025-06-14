#!/bin/bash

# =============================================================================
# Environment Switcher Script
# สคริปต์เปลี่ยน Environment Configuration
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function for colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# Function to show current environment
show_current_env() {
    if [ -f ".env.local" ]; then
        local nextauth_url=$(grep "NEXTAUTH_URL=" .env.local | cut -d'=' -f2)
        local app_env=$(grep "APP_ENV=" .env.local | cut -d'=' -f2)
        
        echo ""
        echo "=== Current Environment Configuration ==="
        echo "APP_ENV: $app_env"
        echo "NEXTAUTH_URL: $nextauth_url"
        echo ""
    else
        print_warning "No .env.local file found"
    fi
}

# Function to switch to development environment
switch_to_dev() {
    print_status "Switching to DEVELOPMENT environment..."
    
    if [ ! -f ".env.development" ]; then
        print_error ".env.development file not found!"
        exit 1
    fi
    
    # Backup current .env.local if it exists
    if [ -f ".env.local" ]; then
        cp .env.local .env.local.backup
        print_info "Backed up current .env.local to .env.local.backup"
    fi
    
    # Copy development config
    cp .env.development .env.local
    print_status "Copied .env.development to .env.local"
    
    show_current_env
    
    print_status "Environment switched to DEVELOPMENT"
    print_info "Both dev and prod now use the same callback URL:"
    print_info "https://line-login.midseelee.com/api/auth/callback/line"
}

# Function to switch to production environment
switch_to_prod() {
    print_status "Switching to PRODUCTION environment..."
    
    # Restore from backup if exists
    if [ -f ".env.local.backup" ]; then
        cp .env.local.backup .env.local
        print_info "Restored .env.local from backup"
    else
        print_warning "No backup found, using current production config"
    fi
    
    show_current_env
    
    print_status "Environment switched to PRODUCTION"
    print_info "LINE Login should work with callback URL: https://line-login.midseelee.com/api/auth/callback/line"
}

# Function to show help
show_help() {
    echo ""
    echo "=== Environment Switcher ==="
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  dev     Switch to development environment (localhost:4325)"
    echo "  prod    Switch to production environment (line-login.midseelee.com)"
    echo "  status  Show current environment configuration"
    echo "  help    Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev      # Switch to development"
    echo "  $0 prod     # Switch to production"
    echo "  $0 status   # Show current environment"
    echo ""
}

# Main script logic
case "${1:-}" in
    "dev"|"development")
        switch_to_dev
        ;;
    "prod"|"production")
        switch_to_prod
        ;;
    "status"|"show")
        show_current_env
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    "")
        print_error "No command specified"
        show_help
        exit 1
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
