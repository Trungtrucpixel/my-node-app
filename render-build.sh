#!/bin/bash
echo "👉 Installing dependencies..."
npm install --include=dev

echo "👉 Building server..."
npx tsc -p tsconfig.json

echo "👉 Building client..."
npx vite build

echo "👉 Checking build results..."
if [ -f "dist/server/index.js" ] && [ -d "dist/public" ]; then
    echo "✅ Build successful! Both server and client built."
    echo "Server: dist/server/index.js"
    echo "Client: dist/public/"
else
    echo "❌ Build failed!"
    [ -f "dist/server/index.js" ] || echo "Missing server build"
    [ -d "dist/public" ] || echo "Missing client build"
    echo "Listing files in current directory:"
    ls -la
    echo "Listing node_modules bin:"
    ls -la node_modules/.bin/ || echo "No node_modules/.bin found"
    exit 1
fi

echo "👉 Build completed successfully!"
