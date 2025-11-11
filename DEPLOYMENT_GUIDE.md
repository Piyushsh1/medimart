# MediMart - Pharmacy Marketplace App
## Store Deployment Guide

### 📱 App Overview
MediMart is a comprehensive pharmacy marketplace mobile application built with React Native (Expo) and FastAPI backend. The app allows users to browse pharmacies, order medicines, upload prescriptions, book lab tests, and consult with doctors.

### ✨ Key Features
- 🏥 **Pharmacy Browsing** - Find nearby pharmacies with location-based search
- 💊 **Medicine Catalog** - Browse and search medicines with detailed information
- 🛒 **Shopping Cart** - Add medicines to cart and checkout
- 💳 **Multiple Payment Options**:
  - Cash on Delivery (COD)
  - Online Payment via Razorpay (UPI, Cards, Wallets, Net Banking)
- 📝 **Prescription Upload** - Upload prescription images for medicine orders
- 🧪 **Lab Tests** - Book and manage lab test appointments
- 👨‍⚕️ **Doctor Consultations** - Schedule online/offline consultations
- 📦 **Order Tracking** - Real-time order status updates
- 👤 **User Profile** - Manage profile and saved addresses

### 🔧 Tech Stack
**Frontend:**
- React Native with Expo
- Expo Router for navigation
- React Native Razorpay for payments
- Socket.IO for real-time updates

**Backend:**
- FastAPI (Python)
- MongoDB (Database)
- Socket.IO for real-time features
- Razorpay SDK for payment processing

### 🚀 Pre-Deployment Checklist

#### 1. Update API Keys
Replace test keys with production keys in `/app/backend/.env`:
```env
RAZORPAY_KEY_ID="your_live_razorpay_key_id"
RAZORPAY_KEY_SECRET="your_live_razorpay_key_secret"
```

Also update in frontend for native apps:
- The Razorpay key is fetched from backend API

#### 2. Configure Backend URL
Update `/app/frontend/.env` with production backend URL:
```env
REACT_APP_BACKEND_URL=https://your-production-api-url.com
```

#### 3. Update App Configuration
Edit `/app/frontend/app.json`:
- Update `expo.name` if needed
- Update `expo.ios.bundleIdentifier` (for iOS)
- Update `expo.android.package` (for Android)
- Add your EAS project ID in `expo.extra.eas.projectId`

#### 4. App Icons & Splash Screen
Ensure you have proper app icons:
- Icon: 1024x1024 PNG (iOS) and 512x512 PNG (Android)
- Splash Screen: 1284x2778 PNG
- Adaptive Icon: 1024x1024 PNG (Android foreground)

Place them in `/app/frontend/assets/images/`:
- `icon.png`
- `splash-icon.png`
- `adaptive-icon.png`
- `favicon.png` (for web)

### 📦 Building for App Stores

#### For Android (Google Play Store)

1. **Install EAS CLI:**
```bash
npm install -g eas-cli
```

2. **Login to Expo:**
```bash
eas login
```

3. **Configure Build:**
```bash
cd /app/frontend
eas build:configure
```

4. **Create Production Build:**
```bash
eas build --platform android --profile production
```

5. **Download APK/AAB:**
The build will be available in your Expo dashboard. Download the `.aab` file for Play Store upload.

#### For iOS (App Store)

1. **Configure Build:**
```bash
cd /app/frontend
eas build:configure
```

2. **Create Production Build:**
```bash
eas build --platform ios --profile production
```

3. **Submit to App Store:**
```bash
eas submit --platform ios
```

**Note:** You need an Apple Developer account ($99/year) for iOS deployment.

### 🔐 Required Accounts & Credentials

1. **Expo Account** (Free)
   - Sign up at: https://expo.dev/signup

2. **Apple Developer Account** (iOS only - $99/year)
   - Sign up at: https://developer.apple.com/

3. **Google Play Console** (Android only - $25 one-time)
   - Sign up at: https://play.google.com/console/

4. **Razorpay Account** (For payments)
   - Sign up at: https://razorpay.com/
   - Get Live API keys from Dashboard

### 🧪 Testing Payments

**Test Mode (Current Setup):**
- Uses Razorpay test keys
- No real money transactions
- Test cards: https://razorpay.com/docs/payments/payments/test-card-details/

**Production Mode:**
1. Replace test keys with live keys in backend `.env`
2. Complete Razorpay KYC verification
3. Test with small real transactions before going live

### 📋 Store Listing Requirements

#### Google Play Store
- **App Name:** MediMart - Pharmacy Marketplace
- **Short Description:** Order medicines, upload prescriptions, book lab tests
- **Full Description:** (Provide detailed description of all features)
- **Category:** Medical / Health & Fitness
- **Content Rating:** PEGI 3 / Everyone
- **Privacy Policy:** Required (host it on a public URL)
- **Screenshots:** At least 2 (max 8) per device type
- **Feature Graphic:** 1024 x 500 pixels

#### Apple App Store
- **App Name:** MediMart
- **Subtitle:** Your Medical Marketplace
- **Description:** (Detailed feature list)
- **Keywords:** pharmacy, medicine, prescription, health, medical
- **Category:** Medical / Health & Fitness
- **Age Rating:** 4+ (No objectionable content)
- **Privacy Policy:** Required
- **Screenshots:** Required for all supported device sizes

### 🔒 Privacy & Compliance

1. **Privacy Policy:** Must include:
   - Data collection practices
   - Location usage explanation
   - Payment information handling
   - User rights and data deletion

2. **Terms of Service:** Define:
   - User responsibilities
   - Refund policy
   - Delivery terms
   - Prescription requirements

3. **Medical Compliance:**
   - Ensure prescription verification process
   - Add disclaimers for medical advice
   - Follow local pharmacy regulations

### 🚀 Deployment Steps Summary

1. ✅ Set up Razorpay live keys
2. ✅ Configure production backend URL
3. ✅ Update app icons and splash screens
4. ✅ Test all features thoroughly
5. ✅ Create privacy policy and terms
6. ✅ Build app using EAS
7. ✅ Prepare store listings
8. ✅ Submit to stores
9. ✅ Monitor reviews and feedback

### 🐛 Testing Checklist

Before submitting to stores, test:
- [ ] User registration and login
- [ ] Pharmacy browsing and search
- [ ] Medicine search and filtering
- [ ] Add to cart functionality
- [ ] Checkout with COD
- [ ] Checkout with online payment
- [ ] Order tracking
- [ ] Prescription upload
- [ ] Lab test booking
- [ ] Consultation booking
- [ ] Profile editing
- [ ] Address management
- [ ] Location permissions
- [ ] Push notifications (if implemented)
- [ ] Error handling
- [ ] Network failure scenarios

### 📞 Support & Maintenance

**Backend Monitoring:**
- Monitor API logs regularly
- Set up error tracking (Sentry)
- Monitor payment gateway webhooks
- Keep database backups

**App Updates:**
- Use OTA (Over-The-Air) updates for minor fixes
- Submit new versions for major features
- Monitor crash reports in Expo dashboard

### 🎯 Post-Launch

1. **Monitor Performance:**
   - App crashes
   - API errors
   - Payment failures
   - User feedback

2. **Marketing:**
   - Create app preview videos
   - Promote on social media
   - Run promotional campaigns
   - Gather user reviews

3. **Iterate:**
   - Add new features based on feedback
   - Optimize performance
   - Fix bugs promptly
   - Update content regularly

### 📄 Important Links

- **Expo Documentation:** https://docs.expo.dev/
- **EAS Build:** https://docs.expo.dev/build/introduction/
- **Razorpay Docs:** https://razorpay.com/docs/
- **Play Store Guide:** https://support.google.com/googleplay/android-developer/
- **App Store Guide:** https://developer.apple.com/app-store/

### ⚠️ Current Limitations

1. **Web Platform:** Online payment only works on native (iOS/Android), not on web
2. **Test Mode:** Currently using Razorpay test keys - update before production
3. **Push Notifications:** Not implemented yet (can be added with expo-notifications)

### 🎉 You're Ready!

Your MediMart app is now ready for store submission. Follow the steps above and you'll be live on both App Store and Play Store soon!

For any issues, check:
- Backend logs: `/var/log/supervisor/backend.err.log`
- Frontend logs: Check Expo console
- Payment issues: Check Razorpay dashboard

Good luck with your launch! 🚀
