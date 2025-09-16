#!/bin/bash
echo "👉 Installing all dependencies..."
npm install

echo "👉 Building server..."
npm run build:server

echo "👉 Building client..."
npm run build:client

echo "👉 Build completed!"
