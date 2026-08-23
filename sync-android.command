#!/bin/bash
# Double-click this file in Finder to run sync-android.sh in a Terminal
# window (macOS runs .command files on double-click; it won't run .sh
# files that way). Keeps the window open afterward so you can see the
# output/any errors before it closes.
cd "$(dirname "$0")"
./sync-android.sh
echo ""
read -p "Press Enter to close this window..."
