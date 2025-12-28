#!/bin/bash

# Sociogram Frontend Build Script for Render Deployment
echo "🚀 Starting Sociogram frontend build..."

# Navigate to frontend directory
cd frontend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Set production environment
echo "🌐 Setting production environment..."
export NODE_ENV=production

# Set production environment variables
echo "🌐 Setting production environment variables..."
export VITE_API_URL=https://sociogram-mongodb-1.onrender.com/api/v1
export VITE_SOCKET_URL=https://sociogram-mongodb-1.onrender.com

# Build the application with production config
echo "🔨 Building application for production..."
npm run build:production

# Verify build output
if [ -d "dist" ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Build output directory: frontend/dist"
    echo "📊 Build size:"
    du -sh dist/
    echo "📋 Build contents:"
    ls -la dist/
else
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "🎉 Frontend build complete and ready for deployment!"
echo "🔗 Backend URL: https://sociogram-mongodb-1.onrender.com"
echo "🔗 Frontend URL: https://sociogram-mongodb-1-frontend.onrender.com"
