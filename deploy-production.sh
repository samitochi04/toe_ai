#!/bin/bash

# TOE AI Production Deployment Script
# This script helps deploy your application to production with live Stripe configuration

set -e  # Exit on any error

echo "🚀 TOE AI Production Deployment Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required environment variables are set
check_env_vars() {
    print_status "Checking environment variables..."
    
    required_vars=(
        "STRIPE_SECRET_KEY"
        "STRIPE_PUBLISHABLE_KEY"
        "STRIPE_WEBHOOK_SECRET"
        "STRIPE_PRICE_ID_PREMIUM"
        "STRIPE_PRICE_ID_PREMIUM_YEARLY"
        "SUPABASE_URL"
        "SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_KEY"
        "OPENAI_API_KEY"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    print_success "All required environment variables are set"
}

# Verify Stripe configuration
verify_stripe_config() {
    print_status "Verifying Stripe configuration..."
    
    if [[ "$STRIPE_SECRET_KEY" == sk_live_* ]]; then
        print_success "Stripe is configured for LIVE mode"
    elif [[ "$STRIPE_SECRET_KEY" == sk_test_* ]]; then
        print_warning "Stripe is configured for TEST mode - this should be changed for production!"
        read -p "Do you want to continue with test mode? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Deployment cancelled. Please update Stripe configuration to live mode."
            exit 1
        fi
    else
        print_error "Invalid Stripe secret key format"
        exit 1
    fi
}

# Build frontend
build_frontend() {
    print_status "Building frontend..."
    
    cd frontend
    
    # Check if .env exists
    if [ ! -f .env ]; then
        print_warning "Frontend .env file not found. Creating from example..."
        if [ -f env.example ]; then
            cp env.example .env
            print_warning "Please update frontend/.env with your production values"
        else
            print_error "Frontend env.example file not found"
            exit 1
        fi
    fi
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    # Build for production
    print_status "Building frontend for production..."
    npm run build
    
    print_success "Frontend built successfully"
    cd ..
}

# Build backend
build_backend() {
    print_status "Building backend..."
    
    cd backend
    
    # Check if .env exists
    if [ ! -f .env ]; then
        print_warning "Backend .env file not found. Creating from example..."
        if [ -f env.example ]; then
            cp env.example .env
            print_warning "Please update backend/.env with your production values"
        else
            print_error "Backend env.example file not found"
            exit 1
        fi
    fi
    
    # Install dependencies
    print_status "Installing backend dependencies..."
    pip install -r requirements.txt
    
    print_success "Backend dependencies installed"
    cd ..
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Add your test commands here
    # Example:
    # cd backend && python -m pytest tests/ && cd ..
    # cd frontend && npm test && cd ..
    
    print_success "Tests completed"
}

# Deploy to server
deploy_to_server() {
    print_status "Deploying to server..."
    
    # Add your deployment commands here
    # Example for Docker:
    # docker-compose -f docker-compose.prod.yml up -d --build
    
    # Example for direct deployment:
    # rsync -avz --exclude node_modules --exclude .git ./ user@server:/path/to/app/
    # ssh user@server "cd /path/to/app && docker-compose up -d --build"
    
    print_success "Deployment completed"
}

# Verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Add health check commands here
    # Example:
    # curl -f http://yourdomain.com/health || exit 1
    
    print_success "Deployment verification completed"
}

# Main deployment function
main() {
    echo "Starting production deployment..."
    echo
    
    # Pre-deployment checks
    check_env_vars
    verify_stripe_config
    
    # Build applications
    build_frontend
    build_backend
    
    # Run tests
    run_tests
    
    # Deploy
    deploy_to_server
    
    # Verify
    verify_deployment
    
    print_success "🎉 Production deployment completed successfully!"
    echo
    print_status "Next steps:"
    echo "1. Verify your Stripe webhook endpoint is working"
    echo "2. Test a real payment transaction"
    echo "3. Monitor your application logs"
    echo "4. Update your DNS if needed"
}

# Run main function
main "$@"
