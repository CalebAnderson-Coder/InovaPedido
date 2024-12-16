#!/bin/bash
set -e
echo "Setting up environment..."
export PATH="$PATH:./node_modules/.bin"
export NODE_OPTIONS="--max-old-space-size=4096"

echo "Installing dependencies..."
npm install

echo "Building project..."
./node_modules/.bin/vite build
