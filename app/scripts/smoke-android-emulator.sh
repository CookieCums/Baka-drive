#!/usr/bin/env bash
set -euo pipefail

package_id="com.bakadrive.app"
apk_root="app/src-tauri/gen/android/app/build/outputs/apk"
apk="$(find "$apk_root" -type f -name '*.apk' ! -path '*androidTest*' | sort | head -n 1)"
if [[ -z "$apk" || ! -s "$apk" ]]; then
  echo "No Android debug APK was produced under $apk_root" >&2
  exit 1
fi

mkdir -p android-evidence
adb wait-for-device
adb shell getprop sys.boot_completed | grep -q '1'
adb logcat -c
adb install -r "$apk"
adb shell am force-stop "$package_id" || true
adb shell monkey -p "$package_id" 1
sleep 18

adb shell dumpsys activity activities > android-evidence/activities.txt
adb shell uiautomator dump /sdcard/baka-drive-window.xml >/dev/null
adb pull /sdcard/baka-drive-window.xml android-evidence/window.xml >/dev/null
adb shell screencap -p /sdcard/baka-drive-login.png
adb pull /sdcard/baka-drive-login.png android-evidence/login.png >/dev/null
adb logcat -d -v brief > android-evidence/logcat.txt

if ! grep -q "$package_id" android-evidence/activities.txt; then
  echo "Baka Drive did not become an active Android activity." >&2
  exit 1
fi
if ! grep -Eiq 'Baka Drive|QR|API ID|API Hash|Telegram|Sign in|Log in' android-evidence/window.xml; then
  echo "The expected authentication/onboarding screen was not found in the Android UI dump." >&2
  exit 1
fi
if grep -E 'FATAL EXCEPTION|JNI DETECTED ERROR|UnsatisfiedLinkError|NoSuchMethodError' android-evidence/logcat.txt; then
  echo "Android logcat reports a fatal runtime/JNI error." >&2
  exit 1
fi

echo "Android smoke passed: APK installed, app launched, login/onboarding UI detected, and no fatal/JNI errors observed."
echo "APK: $apk"
