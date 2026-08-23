# Steady Hands — Android & Google Play Store Publishing Guide

This project is fully prepared for Android packaging and Google Play Store deployment.

---

## 🚀 Quickest Method: Capacitor (Native Android APK/AAB)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Android Studio](https://developer.android.com/studio) installed on your computer

---

### Step 1: Export or Download Code
1. Export the project from AI Studio (ZIP / GitHub).
2. Open your terminal in the extracted project folder.

---

### Step 2: Install Capacitor Dependencies
Run the following commands in the project folder:
```bash
npm install
npm install @capacitor/core @capacitor/cli @capacitor/android
```

---

### Step 3: Build the Web App & Initialize Android
```bash
npm run build
npx cap add android
npx cap sync
```

---

### Step 4: Open in Android Studio
```bash
npx cap open android
```
*Android Studio will launch and index Gradle automatically.*

---

### Step 5: Android Configuration Tweaks

#### 1. Lock Portrait Orientation (Recommended for Balance Gameplay)
In Android Studio, open `android/app/src/main/AndroidManifest.xml`, locate the `<activity ...>` tag, and add:
```xml
android:screenOrientation="portrait"
```

#### 2. Verify Sensor & Haptic Permissions
Ensure the following permissions are inside `AndroidManifest.xml` (above the `<application>` tag):
```xml
<uses-permission android:name="android.permission.VIBRATE" />
<uses-feature android:name="android.hardware.sensor.accelerometer" android:required="true" />
<uses-feature android:name="android.hardware.sensor.gyroscope" android:required="false" />
```

---

### Step 6: Generate Signed Android App Bundle (.aab)
1. In Android Studio, go to **Build > Generate Signed Bundle / APK...**
2. Select **Android App Bundle** (Google Play requirement) and click **Next**.
3. Create a new Keystore (or choose an existing one), set passwords, and save it safely.
4. Select **release** build variant and click **Finish**.
5. Your production `.aab` file will be generated in `android/app/release/app-release.aab`.

---

### Step 7: Upload to Google Play Console
1. Log in to [Google Play Console](https://play.google.com/console).
2. Click **Create app**:
   - App name: `Steady Hands: Zen Balance`
   - Default language: `English`
   - App or Game: `Game` (or `App`)
   - Free or Paid: `Free`
3. In **Production** (or **Closed Testing**), create a new release and drag & drop the generated `app-release.aab`.
4. Fill in:
   - **Store Listing**: Screenshots, icon, short description, and feature graphic.
   - **Content Rating**: Complete the standard questionnaire.
   - **Privacy Policy**: (A simple standard privacy policy URL stating sensor data is processed locally).
5. Click **Review & Rollout** to submit for Google verification!

---

## 🌐 Alternative Method: PWA Builder (Cloud TWA)
If you deploy this web app to a live HTTPS URL:
1. Go to [PWABuilder.com](https://www.pwabuilder.com).
2. Enter your live HTTPS URL.
3. Click **Package for Android** -> Download the generated signed `.aab` package ready for Play Store!
