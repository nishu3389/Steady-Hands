#!/bin/bash
# Pulls the latest code and refreshes the Android project so Android Studio
# picks it up. Run from anywhere — cds into the project root itself first.
#
# Usage (from Android Studio's Terminal, which opens inside android/):
#   ../sync-android.sh
# Or from a regular terminal:
#   /Users/apple/Desktop/Steady-Hands/sync-android.sh

set -e  # stop immediately if any step fails, instead of silently continuing

cd "$(dirname "$0")"

echo "==> git pull"
git pull origin main

echo "==> npm run build"
npm run build

echo "==> npx cap sync"
npx cap sync

echo "==> Done. In Android Studio: Build > Rebuild Project (if MainActivity.java or any native file changed), then Run."
