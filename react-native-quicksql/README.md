# QuickSQL - React Native Android Application

**QuickSQL** is a light, fast, and smooth SQL and PostgreSQL database client and query runner built in **React Native** for Android.

---

## 📱 Features

- **In-Browser & On-Device SQL Engine**: Run real SQL queries directly on your phone with zero server dependency.
- **Tables & Attributes Inspector**:
  - Live table and attribute counters (`Tables (N)`, `Attrs (M)`).
  - Expand and minimise accordion for every table.
  - Dedicated "All Attributes" searchable dictionary.
  - One-tap attribute insertion into query editor.
- **Zen Focus Mode**:
  - Hide all distractions and navigation tabs.
  - Floating tiny Unhide button in top corner to restore interface anytime.
- **Multi-Tab SQL Editor**: Multiple query scratchpads with quick SQL keyword snippets.
- **Scrollable Results Grid**: Horizontal and vertical scrolling with row numbers, column types, and execution timing in milliseconds.
- **Dark & Light Mode**: High-contrast, battery-friendly dark theme.

---

## 🚀 How to Build the Android APK

You can build the APK in 3 different ways:

### Method 1: Instant Cloud Build (No Android Studio required)
The fastest way to get a signed, installable `.apk` file:
```bash
cd react-native-quicksql
npm install
npx eas-cli build -p android --profile preview
```
*EAS Build compiles the APK in the cloud and provides a direct QR code / download link to install on your phone.*

---

### Method 2: Local Gradle Build (With Android SDK / Android Studio)
```bash
cd react-native-quicksql
npm install

# Generate the native Android Gradle project
npx expo prebuild --platform android

# Compile the debug APK
cd android
./gradlew assembleDebug

# Your compiled APK will be generated at:
# android/app/build/outputs/apk/debug/app-debug.apk
```

---

### Method 3: GitHub Actions (Automated CI/CD)
This repository includes `.github/workflows/build-apk.yml`.
Simply push your repository to GitHub or trigger the workflow manually:
1. Go to the **Actions** tab on your GitHub repository.
2. Select **Build Android APK** and click **Run workflow**.
3. Download the compiled `quicksql-android-apk` directly from the workflow summary!

---

## 💻 Running the App on an Android Device or Emulator

```bash
cd react-native-quicksql
npm install
npm run android
```
