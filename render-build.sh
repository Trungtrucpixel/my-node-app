#!/bin/bash
echo "👉 Installing dependencies..."
npm install --production=false

echo "👉 Building TypeScript project..."
npm run build

echo "👉 Checking if build was successful..."
if [ -f "dist/server/index.js" ]; then
    echo "✅ Build successful! dist/server/index.js exists."
else
    echo "❌ Build failed! dist/server/index.js not found."
    echo "Checking project structure..."
    find . -name "*.ts" | head -10
    echo "Trying to build with verbose output..."
    npx tsc --project tsconfig.json --verbose
    exit 1
fi

echo "👉 Build completed successfully!"
