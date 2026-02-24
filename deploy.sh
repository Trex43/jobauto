#!/bin/bash

# JobAuto Deployment Script
# Supports: Render, Railway, Vercel, AWS

set -e

echo "🚀 JobAuto Deployment Script"
echo "=============================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    print_success "Dependencies check passed"
}

# Build frontend
build_frontend() {
    print_status "Building frontend..."
    
    npm install
    npm run build
    
    print_success "Frontend built successfully"
}

# Build backend
build_backend() {
    print_status "Building backend..."
    
    cd backend
    npm install
    npm run build
    cd ..
    
    print_success "Backend built successfully"
}

# Deploy to Render
deploy_render() {
    print_status "Deploying to Render..."
    
    if ! command -v render &> /dev/null; then
        print_warning "Render CLI not found. Using manual deployment."
        print_status "Please follow these steps:"
        echo "1. Create a new Web Service on Render"
        echo "2. Connect your GitHub repository"
        echo "3. Set root directory to 'backend' for API"
        echo "4. Set build command: npm install && npm run build"
        echo "5. Set start command: npm start"
        echo "6. Add environment variables"
        return
    fi
    
    render deploy
    print_success "Deployed to Render"
}

# Deploy to Railway
deploy_railway() {
    print_status "Deploying to Railway..."
    
    if ! command -v railway &> /dev/null; then
        print_status "Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    if ! railway whoami &> /dev/null; then
        print_status "Logging in to Railway..."
        railway login
    fi
    
    railway up
    print_success "Deployed to Railway"
}

# Deploy to Vercel
deploy_vercel() {
    print_status "Deploying to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        print_status "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    vercel --prod
    print_success "Deployed to Vercel"
}

# Deploy with Docker
deploy_docker() {
    print_status "Deploying with Docker..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    docker-compose -f docker-compose.prod.yml up -d --build
    print_success "Deployed with Docker"
}

# Main menu
show_menu() {
    echo ""
    echo "Select deployment target:"
    echo "1) Render (Free Tier)"
    echo "2) Railway (Free Tier)"
    echo "3) Vercel (Frontend Only)"
    echo "4) Docker (Self-hosted)"
    echo "5) Build Only"
    echo "6) Exit"
    echo ""
}

# Main
main() {
    check_dependencies
    
    while true; do
        show_menu
        read -p "Enter your choice (1-6): " choice
        
        case $choice in
            1)
                build_backend
                deploy_render
                break
                ;;
            2)
                build_backend
                deploy_railway
                break
                ;;
            3)
                build_frontend
                deploy_vercel
                break
                ;;
            4)
                build_frontend
                build_backend
                deploy_docker
                break
                ;;
            5)
                build_frontend
                build_backend
                print_success "Build completed!"
                break
                ;;
            6)
                echo "Exiting..."
                exit 0
                ;;
            *)
                print_error "Invalid choice. Please try again."
                ;;
        esac
    done
    
    echo ""
    print_success "Deployment process completed!"
}

# Run main function
main
