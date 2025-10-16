#!/bin/bash

# TOE AI Deployment Script for Coolify/VPS
# This script helps with deployment preparation and management

set -e

echo "🚀 TOE AI Deployment Script"
echo "=========================="

# Check if docker and docker-compose are installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    echo "✅ Docker and Docker Compose are installed"
}

# Create production environment file
create_env_file() {
    if [ ! -f .env ]; then
        echo "📝 Creating .env file from template..."
        cp .env.production .env
        echo "⚠️  Please edit the .env file with your production values before deployment!"
        echo "   - Set your SECRET_KEY"
        echo "   - Configure Supabase credentials"
        echo "   - Add OpenAI API key"
        echo "   - Set Stripe keys"
        echo "   - Update CORS origins with your domain"
        exit 1
    else
        echo "✅ .env file exists"
    fi
}

# Build images
build_images() {
    echo "🔨 Building Docker images..."
    docker-compose -f docker-compose.yml build --no-cache
    echo "✅ Images built successfully"
}

# Deploy application
deploy() {
    echo "🚀 Deploying TOE AI..."
    docker-compose -f docker-compose.yml up -d
    echo "✅ Deployment completed"
}

# Show status
show_status() {
    echo "📊 Application Status:"
    docker-compose -f docker-compose.yml ps
    
    echo ""
    echo "📋 Container Logs:"
    echo "To view backend logs: docker-compose logs backend"
    echo "To view frontend logs: docker-compose logs frontend"
    echo "To view all logs: docker-compose logs -f"
}

# Stop application
stop() {
    echo "⏹️  Stopping TOE AI..."
    docker-compose -f docker-compose.yml down
    echo "✅ Application stopped"
}

# Clean up (remove containers and images)
cleanup() {
    echo "🧹 Cleaning up..."
    docker-compose -f docker-compose.yml down --rmi all --volumes --remove-orphans
    echo "✅ Cleanup completed"
}

# Show help
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy    - Deploy the application (default)"
    echo "  build     - Build Docker images only"
    echo "  status    - Show application status"
    echo "  stop      - Stop the application"
    echo "  cleanup   - Stop and remove all containers, images, and volumes"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy   # Deploy the application"
    echo "  $0 status   # Check application status"
    echo "  $0 stop     # Stop the application"
}

# Main execution
main() {
    check_docker
    
    case "${1:-deploy}" in
        "deploy")
            create_env_file
            build_images
            deploy
            show_status
            ;;
        "build")
            build_images
            ;;
        "status")
            show_status
            ;;
        "stop")
            stop
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            echo "❌ Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"