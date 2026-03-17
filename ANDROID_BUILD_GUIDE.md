# Gold Predict — Android APK Build Guide

## What's Already Done (Replit)
- Mobile-first UI redesigned (bottom navigation, compact header)
- Single Pro plan (unlimited, $19.99/month)
- Capacitor configured (`capacitor.config.ts`)
- Google Play Billing backend ready (`server/services/googlePlayService.ts`)
- Mobile HTML viewport and safe-area CSS set up

---

## Prerequisites (Your Computer)
1. [Android Studio](https://developer.android.com/studio) installed
2. [Node.js 18+](https://nodejs.org) installed
3. [Java JDK 17](https://adoptium.net/) installed
4. A [Google Play Developer account](https://play.google.com/console) ($25 one-time fee)

---

## Step 1: Clone and prepare

```bash
git clone https://github.com/refnr/goldpredictlivetest.git
cd goldpredictlivetest
npm install
```

---

## Step 2: Build the web app

```bash
npm run build
```

This creates the `dist/public/` folder that Capacitor wraps.

---

## Step 3: Add Android platform

```bash
npx cap add android
npx cap sync android
```

This creates the `android/` folder with the full Android project.

---

## Step 4: Open in Android Studio

```bash
npx cap open android
```

Android Studio will open. Wait for Gradle sync to finish.

---

## Step 5: Configure your app

In Android Studio:
1. Open `android/app/build.gradle`
2. Set your `applicationId` to `com.goldpredict.app`
3. Set `versionCode` and `versionName`

---

## Step 6: Set up Google Play Billing

In your Android app, you'll use the Google Play Billing Library.

Add to `android/app/build.gradle`:
```gradle
dependencies {
    implementation 'com.android.billingclient:billing:6.1.0'
}
```

The subscription product ID to use: `gold_predict_pro_monthly`

Set up this product in Google Play Console:
1. Go to your app → Monetize → Subscriptions
2. Create subscription with ID: `gold_predict_pro_monthly`
3. Price: $19.99/month
4. Base plan: monthly auto-renewal

---

## Step 7: Backend environment variables

Add to your Render.com environment:

```
GOOGLE_PLAY_SERVICE_ACCOUNT_KEY={"type":"service_account",...}  # JSON from Google Cloud
```

To get the service account key:
1. Go to Google Play Console → Setup → API access
2. Link to a Google Cloud project
3. Create a service account with "Financial Data Viewer" permission
4. Download the JSON key file
5. Paste its entire contents as the env var value

---

## Step 8: Set up Google Play webhook (Pub/Sub)

1. In Google Cloud Console, create a Pub/Sub topic
2. Create a subscription that pushes to: `https://your-app.onrender.com/api/play/webhook`
3. In Google Play Console → Monetize → Real-time developer notifications, set the Pub/Sub topic

---

## Step 9: Build and sign the APK

In Android Studio:
1. `Build` → `Generate Signed Bundle / APK`
2. Choose `Android App Bundle` (.aab) — required for Play Store
3. Create a new keystore (keep it safe — you need it for all future updates)
4. Build the release bundle

---

## Step 10: Submit to Play Store

1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app: "Gold Predict"
3. Upload your `.aab` file
4. Fill in store listing (screenshots, description, icon)
5. Set content rating
6. Publish to internal testing first, then production

---

## App Icon

The icon should be 512x512 PNG with the gold/dark theme.
Place it in `android/app/src/main/res/` folders.

---

## After Publishing

- Users download the app free from Play Store
- They tap "Start Subscription" → Google Play Billing sheet appears
- They authorize payment ($19.99/month)
- Your server verifies the purchase token via `/api/play/verify`
- Their account gets marked as active in your database
- Monthly billing happens automatically by Google

---

## Important Numbers

- Google takes 15% after 12 months, 30% in year one
- You receive ~$17/month per user after year one
- Google handles tax collection in most countries
- Users cancel through Google Play app settings
