#!/bin/bash

echo "========================================"
echo "NVI Investment Dashboard Builder"
echo "Building Linux Installer"
echo "========================================"
echo

echo "Step 1: Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: npm install failed!"
    exit 1
fi

echo
echo "Step 2: Building Linux installer..."
npm run build:linux
if [ $? -ne 0 ]; then
    echo "ERROR: Build failed!"
    exit 1
fi

echo
echo "========================================"
echo "SUCCESS! Installer created!"
echo "========================================"
echo
echo "Your installers are located at:"
echo "  - AppImage: $(pwd)/dist/NVI Investment Dashboard-1.0.0.AppImage"
echo "  - Debian:   $(pwd)/dist/nvi-investment-dashboard_1.0.0_amd64.deb"
echo
echo "You can now:"
echo "1. Install it on this computer"
echo "2. Copy it to other Linux computers"
echo "3. Share it via USB, email, or cloud storage"
echo
echo "To install:"
echo "  AppImage: chmod +x 'dist/NVI Investment Dashboard-1.0.0.AppImage' && ./dist/NVI\ Investment\ Dashboard-1.0.0.AppImage"
echo "  Debian:   sudo dpkg -i dist/nvi-investment-dashboard_1.0.0_amd64.deb"
echo
