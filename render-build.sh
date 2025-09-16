#!/bin/bash
echo "👉 Installing dependencies..."
npm install

echo "👉 Building TypeScript project..."
npm run build

echo "👉 Checking if build was successful..."
if [ -f "dist/server/index.js" ]; then
    echo "✅ Build successful! dist/server/index.js exists."
else
    echo "❌ Build failed! dist/server/index.js not found."
    echo "Contents of dist directory:"
    ls -la dist/ || echo "No dist directory found"
    exit 1
fi

echo "👉 Build completed successfully!"
