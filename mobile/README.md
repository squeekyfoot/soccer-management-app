# **Soccer Management App \- Mobile Client**

A React Native application targeting iOS and Android.  
**Crucial Rule:** This app follows the **"Mirror Protocol."** Its folder structure (src/components/views/...) matches the Web App exactly to maintain mental continuity for developers.

## **Mobile-Specific Architecture**

While we mirror the Web's *structure*, the *implementation* relies on Native Modules and a "Translation Layer."

### **1\. The "Translation Layer" (Web vs. Native)**

| Feature | Web Implementation | Mobile Implementation | Reason |
| :---- | :---- | :---- | :---- |
| **DOM Elements** | \<div\>, \<span\>, \<input\> | \<View\>, \<Text\>, \<TextInput\> | React Native renders to native UI views, not HTML. |
| **Styling** | CSS / ClassNames | StyleSheet.create({}) | No CSS engine; uses Flexbox-like JS objects. |
| **Scrolling** | Automatic (Browser) | Explicit \<ScrollView\> or \<FlatList\> | Views are static by default; scrolling must be enabled. |
| **Lists** | .map() | \<FlatList\> | **Performance:** FlatList virtualizes long lists (like Chats) to save memory. |
| **Alerts** | window.alert() | Alert.alert() | Native system dialogs. |
| **Images** | \<img src="..."\> | \<Image source={{uri: ...}} /\> | **Gotcha:** Requires explicit width and height styles or it won't render. |

### **2\. Native Modules (The Hardware Link)**

We cannot use browser APIs (like navigator or document). We rely on specific libraries to bridge the gap:

* **react-native-image-picker**: Replaces \<input type="file"\> for accessing Camera/Gallery.  
* **react-native-image-resizer**: Replaces HTML5 Canvas for client-side image compression.  
* **react-native-safe-area-context**: Handles the iPhone notch and Home Indicator to prevent UI overlaps.  
* **react-native-svg**: Required to render Lucide Icons (unlike Web where SVGs are native).

**Warning:** If you add a new library that uses native code, you **MUST** rebuild the binary (npm run ios) or the app will crash. Hot reloading is not enough.

### **3\. Navigation**

We use **React Navigation (v6)** instead of a Router.

* **Stack Navigator:** Handles "pushing" screens (e.g., Chat Details, Edit Profile) so users can swipe back.  
* **Tab Navigator:** The main bottom navigation bar.  
* **Parity:** Route names (Home, Community, Messaging) match the Web View component names.

## **Development & Build**

### **Prerequisites**

* Node.js (v18+)  
* CocoaPods (for iOS)  
* Xcode (iOS) & Android Studio (Android)  
* Watchman (brew install watchman)

### **Installation**

1. **Install JS Dependencies:**  
   npm install

2. **Install Native Pods (iOS \- REQUIRED):**  
   cd ios  
   pod install  
   cd ..

### **Running the App**

* **Start Metro Bundler:**  
  npm start

* **Launch iOS Simulator:**  
  npm run ios

* **Reset Cache (If strange errors occur):**  
  npm start \-- \--reset-cache

### **Deployment (TestFlight)**

1. Open ios/mobile.xcworkspace in Xcode.  
2. Select "Any iOS Device (arm64)" as the target.  
3. **Product \-\> Archive**.  
4. Once archived, click **Distribute App \-\> TestFlight & App Store**.  
5. *Troubleshooting:* If you see "Upload Symbols Failed" for Hermes, you may uncheck "Upload Symbols" for Beta builds to bypass the error.

## **Common Gotchas & Fixes**

1. **"Black Circle" Images:**  
   * **Cause:** The \<Image\> component has a background color but no image loaded, or the image URL is invalid.  
   * **Fix:** Ensure the URL is valid (no appended query params causing 403s) and that width/height are set. Use the Avatar component which handles loading states.  
2. **"Undefined is not a function" (Images):**  
   * **Cause:** Trying to use createImageBitmap or document.createElement (Web APIs).  
   * **Fix:** Use mobile/src/utils/imageUtils.js which wraps react-native-image-resizer instead.  
3. **Keyboard Covering Input:**  
   * **Cause:** iOS keyboard slides up over the view.  
   * **Fix:** Always wrap forms or chat inputs in a \<KeyboardAvoidingView\> with the correct behavior (padding for iOS, height for Android).

## **✅ Maintenance & Deployment Routine**

Strict adherence to this routine is required to handle the complexity of Native Modules and App Store reviews.

### **1. Regression Testing & Native Mocks**
We use **Jest** and **React Testing Library** for automated checks.
* **Command:** `npm run test:ci`
* **The Mocking Rule:** If you add a library with Native Code (e.g., Maps, Sensors), you **MUST** add a mock for it in `jest.setup.js`, otherwise tests will crash.

### **2. The Mirror Protocol (Parity Checklist)**
* [ ] **Structure Match:** Does `src/components/views/...` EXACTLY match the Web path?
* [ ] **Logic Reuse:** Did I check `AuthContext` before writing a new API call?
* [ ] **Sub-Components:** Did I break down the UI to match Web granularity?

### **3. Native Integrity Checklist**
* [ ] **New Libraries:** If added, did I run `cd ios && pod install`?
* [ ] **Rebuild:** Did I run `npm run ios` to link the new binary? (Hot reload is not enough).
* [ ] **Safe Areas:** Is `SafeAreaView` used to handle the Notch?
* [ ] **Images:** Do all `<Image />` tags have explicit `width` and `height`?

### **4. Build & Ship (TestFlight)**
1.  **Version Bump:** Increment Version/Build Number in Xcode.
2.  **Happy Path:** Run `npm run ios` and manually verify the core feature works.
3.  **Archive:** Xcode -> Product -> Archive.
4.  **Distribute:** Validate -> Upload to App Store Connect.