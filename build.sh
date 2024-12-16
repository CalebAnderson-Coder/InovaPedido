#!/bin/bash
export PATH="$PATH:./node_modules/.bin"
export NODE_OPTIONS="--max-old-space-size=4096"

npm ci
./node_modules/.bin/vite build
