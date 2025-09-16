#!/bin/bash
echo "👉 Removing Replit-specific plugins from package.json..."
# Tạm thời xóa các plugin Replit khỏi package.json
npm remove @replit/vite-plugin-runtime-error-modal @replit/vite-plugin-cartographer @replit/vite-plugin-dev-banner

echo "👉 Installing dependencies..."
npm install

echo "👉 Building server..."
npm run build:server

echo "👉 Building client..."
npm run build:client

echo "👉 Checking build results..."
if [ -f "dist/server/index.js" ] && [ -d "dist/public" ]; then
    echo "✅ Build successful! Both server and client built."
    echo "Server: dist/server/index.js"
    echo "Client: dist/public/"
else
    echo "❌ Build failed!"
    [ -f "dist/server/index.js" ] || echo "Missing server build"
    [ -d "dist/public" ] || echo "Missing client build"
    exit 1
fi

echo "👉 Build completed successfully!"
