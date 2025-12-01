# **Soccer Management App \- Web Client**

This is the **Source of Truth** for the application's design and functionality. It is a Single Page Application (SPA) built with React and bootstrapped with Create React App.

## **Architecture Overview**

The Web App is designed as a **Responsive Dashboard**. It serves two distinct user modes based on viewport size:

1. **Desktop:** A full-featured management dashboard with a persistent sidebar.  
2. **Mobile Web:** A simplified, touch-friendly interface with a bottom tab bar (mimicking the native app).

### **Key Web Patterns**

1. **Responsive Logic:**  
   * We do **not** use a heavy UI framework (like Bootstrap).  
   * We use raw CSS/SCSS modules and a centralized src/lib/constants.js file for breakpoints.  
   * **MOBILE\_BREAKPOINT \= 768**: This constant drives conditional rendering in React (e.g., isMobile ? \<MobileNav /\> : \<Sidebar /\>).  
2. **Browser Capabilities:**  
   * **Image Compression:** We leverage the HTML5 \<canvas\> API (src/utils/imageUtils.js) to resize images client-side *before* upload. This significantly reduces bandwidth usage and storage costs.  
   * **Portals:** Modal components (ImageViewer.js) utilize ReactDOM.createPortal to render overlay layers outside the main DOM hierarchy, ensuring they sit above all other content (z-index safety).  
3. **Routing:**  
   * Uses react-router-dom for URL-based navigation.  
   * All "Views" are top-level routes defined in App.js or Layout.js.

## **Folder Structure (The Standard)**

This structure defines the **Domain Modules** that the Mobile App must mirror.

* **src/components/auth/**: Login, Signup, and Re-authentication modals.  
* **src/components/common/**: Atomic, reusable UI elements (Button, Card, Input, Avatar). These are "dumb" components with no business logic.  
* **src/components/layout/**: The application shell (Layout.js) containing the Sidebar/Navbar.  
* **src/components/shared/**: Complex business components reused across views (e.g., UserSearch.js).  
* **src/components/views/**: Feature-specific modules. **This is the core mapping for Mobile.**  
  * **Home/**: Dashboard and Calendar logic.  
  * **Messaging/**: The chat system (TeamChat, ChatList).  
  * **Profile/**: User settings (MyProfile, SportsInfo).  
  * **Manager/**: Admin tools (ManagerDashboard, RosterList, IncomingRequests).  
  * **Community/**: Group finding and social feeds.  
* **src/context/**: Global state providers (AuthContext, ChatContext).

## **Development**

### **Prerequisites**

* Node.js (v18+)  
* npm

### **Running Locally**

npm start

Runs the app in development mode at [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000).

### **Deployment**

The web app is deployed to **Firebase Hosting**.  
npm run build  
firebase deploy

## **Web-Specific Maintenance**

* **Favicons & Manifests:** Ensure public/manifest.json is updated if app icons change. This controls the PWA (Progressive Web App) appearance when users add the site to their home screen.  
* **CORS:** If interacting with external APIs or Firebase Storage buckets, ensure CORS rules are configured to allow the hosting domain.

## **✅ Maintenance & Deployment Routine**

Follow this routine before every deploy to ensure the "Source of Truth" remains stable.

### **1. Regression Testing (The Safety Check)**
Before building, run the automated suite to catch broken logic.
* **Command:** `npm run test:ci`
* **Rule:** If this fails, **STOP**. Do not deploy. Fix the regression first.
* **Scope:** This checks `src/App.test.js` and any unit tests for Hooks/Contexts.

### **2. Architecture Checklist**
* [ ] **Parity Check:** If I added a feature (e.g., `Views/Profile`), is the folder structure standard?
* [ ] **Responsive Logic:** Did I verify the view on both Desktop (>768px) and Mobile (<768px)?
* [ ] **Security:** If I added a write operation, did I verify `firestore.rules`?

### **3. Pre-Deployment Verification**
* [ ] **Assets:** If the logo changed, is `public/manifest.json` updated?
* [ ] **Environment:** Is `.env` correctly configured?
* [ ] **CORS:** Are external API headers set?

### **4. Deployment Steps**
1.  `npm run test:ci` (Must Pass)
2.  `npm run build`
3.  `firebase deploy`
4.  **Verify:** Open the live URL and hard-refresh.