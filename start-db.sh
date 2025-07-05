#!/bin/bash

echo "🐳 Starting CollabBoard MongoDB Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Start MongoDB and Mongo Express
echo "🚀 Starting MongoDB and Mongo Express..."
docker-compose up -d

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
sleep 10

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ MongoDB environment is ready!"
    echo ""
    echo "📊 Services:"
    echo "  • MongoDB: mongodb://localhost:27017"
    echo "  • Mongo Express: http://localhost:8081"
    echo "    - Username: admin"
    echo "    - Password: admin123"
    echo ""
    echo "🔐 Database Credentials:"
    echo "  • Database: collabboard"
    echo "  • Username: collabboard_user"
    echo "  • Password: collabboard_password"
    echo ""
    echo "🚀 You can now start the backend server with:"
    echo "  cd backend && npm run dev"
else
    echo "❌ Failed to start MongoDB environment"
    docker-compose logs
    exit 1
fi
