#!/bin/bash

# ozfabric - One Click Setup Script

echo "🚀 Starting ozfabric setup..."

# 1. Check for Node.js
if ! command -v node &> /dev/null
then
    echo "❌ Error: Node.js is not installed. Please install it from https://nodejs.org/"
    exit 1
fi

# 2. Install Dependencies
echo "📦 Installing kütüphaneler (dependencies)..."
npm install

# 3. Check for .env.local
if [ ! -f .env.local ]; then
    echo "⚠️ Warning: .env.local file missing!"
    echo "Please copy your API keys to a .env.local file in this directory."
else
    echo "✅ .env.local found."
fi

# 4. Success Message
echo "------------------------------------------------"
echo "✅ Setup Complete!"
echo "🚀 To start the project, run: npm run dev"
echo "🤖 To use Antigravity, just open this folder in Cursor/VS Code."
echo "------------------------------------------------"
