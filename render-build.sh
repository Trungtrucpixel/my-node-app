#!/bin/bash
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
    echo "Trying to build with verbose output..."
    npx tsc --project tsconfig.json --verbose
    exit 1
fi

echo "👉 Build completed successfully!"
