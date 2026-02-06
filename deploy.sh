#!/bin/bash

# Spelling Bee Deployment Script
# Builds and deploys the frontend to Cloudflare Pages

set -e  # Exit on error

echo "🔨 Building frontend..."
npm run build

echo ""
echo "🚀 Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist --project-name=spellingisfun --branch=main

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your game is live at: https://spellingisfun.pages.dev"
