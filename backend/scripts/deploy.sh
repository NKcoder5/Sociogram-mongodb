#!/bin/bash

# Sociogram Backend Deployment Script
echo "🚀 Starting Sociogram backend deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if database needs seeding
echo "🔍 Checking database status..."
# For MongoDB, we can just run the seed script if it's explicitly requested 
# or if it's a fresh environment.
if [ "$SEED_DATABASE" = "true" ]; then
    echo "🌱 Seeding database with initial data..."
    node utils/runFullSeed.js
else
    echo "📊 Skipping automatic seed (set SEED_DATABASE=true to force seeding)"
fi

echo "✅ Backend deployment complete!"
echo "🔗 Database connected via Mongoose"
