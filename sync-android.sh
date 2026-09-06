#!/bin/bash
# Commits and pushes any local changes, pulls the latest code, refreshes the
# Android project, then builds a debug APK and installs + launches it on the
# connected device -- so running this alone is enough to see the latest
# changes (from here or elsewhere, e.g. AI Studio) on your phone.
#
# Usage (from Android Studio's Terminal, which opens inside android/):
#   ../sync-android.sh
# Or from a regular terminal:
#   /Users/apple/Steady-Hands/sync-android.sh

set -e  # stop immediately if any step fails, instead of silently continuing

cd "$(dirname "$0")"

echo "==> git add & commit & push (local changes)"
git add -A
if git diff --cached --quiet; then
  echo "    no local changes to commit"
else
  git commit -m "chore: sync local changes $(date '+%Y-%m-%d %H:%M:%S')"
  git push origin main
fi

echo "==> git pull"
git pull origin main

echo "==> npm run build"
npm run build

echo "==> npx cap sync"
npx cap sync

cd android
chmod +x ./gradlew

# Gradle needs JDK 21+, but the system `java` here is JBR 17 -- so borrow
# Android Studio's own bundled JDK instead of relying on whatever's on PATH.
for studio_jbr in "/Applications/Android Studio"*.app/Contents/jbr/Contents/Home; do
  if [ -x "$studio_jbr/bin/java" ] && "$studio_jbr/bin/java" -version 2>&1 | grep -qE 'version "(2[1-9]|[3-9][0-9])'; then
    export JAVA_HOME="$studio_jbr"
    export PATH="$JAVA_HOME/bin:$PATH"
    break
  fi
done

echo "==> ./gradlew assembleDebug"
./gradlew assembleDebug

APK="app/build/outputs/apk/debug/app-debug.apk"
APP_ID="com.steadyhands.balance"

echo "==> adb install -r"
adb install -r "$APK"

echo "==> adb launch"
adb shell am force-stop "$APP_ID"
adb shell am start -n "$APP_ID/.MainActivity"

echo "==> Done. Latest build is running on the connected device."
