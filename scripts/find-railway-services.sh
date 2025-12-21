#!/bin/bash

# Script to help find Railway service details

echo "🔍 Finding Railway Service Details..."
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found!"
    echo "   Install it: npm i -g @railway/cli"
    echo "   Then run: railway login"
    exit 1
fi

echo "📋 Current Railway Status:"
echo ""

# Check if linked to a project
if railway status &> /dev/null; then
    echo "✅ Linked to a project"
    railway status
    echo ""
else
    echo "⚠️  Not linked to a project"
    echo "   Run: railway link"
    echo ""
fi

echo "📦 Listing all services in current project:"
echo ""

# List services (this might require being in a project directory or linked)
railway service list 2>/dev/null || {
    echo "   (Need to be linked to a project first)"
    echo "   Run: railway link"
    echo ""
}

echo ""
echo "🌐 Finding service details:"
echo ""
echo "Method 1: Railway Dashboard"
echo "   1. Go to https://railway.app/dashboard"
echo "   2. Click on your project"
echo "   3. The service name is shown at the top of each service"
echo "   4. Service names are usually: EGCCNewWebsite, web, or similar"
echo ""
echo "Method 2: Railway CLI"
echo "   railway service list          # List all services"
echo "   railway status                # Show current project/service"
echo "   railway link                  # Link to a project"
echo ""
echo "Method 3: Check Environment"
echo "   Railway service names are often visible in:"
echo "   - Railway dashboard URL"
echo "   - Deployment logs"
echo "   - Service settings"
echo ""

