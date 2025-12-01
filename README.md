# **Soccer Management App (Web & Mobile)**

Welcome to the **Soccer Management App**, a comprehensive, dual-platform solution designed to revolutionize how players, managers, and communities coordinate sports teams.  
This repository operates as a **Virtual Monorepo**, housing two distinct client applications that share a backend, architectural philosophy, and business logic:

* **web/**: A React Single Page Application (SPA) optimized for desktop management and mobile-web access.  
* **mobile/**: A React Native iOS/Android Application providing a native, on-the-go experience.  
* **docs/**: Centralized architectural guides and documentation.

## **Core Architecture: The "Law of Parity"**

To minimize technical debt and cognitive load when switching contexts, this project enforces **Strict Structural and Logical Parity**.

### **1\. The Mirror Protocol (Directory Parity)**

If a feature module exists in the Web app, it **MUST** exist in the Mobile app with the exact same folder structure and file naming convention.

* **Web:** web/src/components/views/Profile/MyProfile.js  
* **Mobile:** mobile/src/components/views/Profile/MyProfile.js

**Why?** This allows a developer to instantly locate the corresponding file on the other platform without searching. If you are fixing a bug in the "Profile" feature on Web, you know exactly where to look on Mobile.

### **2\. The "Brain vs. Body" Separation**

We strive to separate **Business Logic** from **UI Rendering**.

* **The Brain (Logic):** Data fetching, form handling, validation, and state management should be extracted into **Custom Hooks** (e.g., useProfileLogic.js) or **Context Providers**. These logic layers should be nearly identical across platforms.  
* **The Body (UI):** The view files (.js) should be thin wrappers that consume these hooks and render the platform-specific UI elements (\<div\> vs \<View\>, \<button\> vs \<TouchableOpacity\>).

### **3\. Shared State Management**

Both apps utilize React Context to manage global domain state, avoiding the complexity of Redux for this scale:

* **AuthContext**: Handles User Identity, Session Persistence, Roster Data, and Event Data.  
* **ChatContext**: Handles Real-time Messaging, Group Syncing, and Unread Counts.

## **Instructions for AI Collaborators**

If you are an AI assistant helping to maintain this codebase, you **MUST** adhere to these directives to prevent regression:

1. **Parity First:** Before generating code for a new feature, analyze the folder structure of the existing platform (Web/Mobile) and mirror it exactly on the target platform.  
2. **Sub-Component Isolation:** If the Web version splits logic into sub-components (e.g., IncomingRequests.js, RosterList.js), the Mobile version **must** do the same. Do not inline complex logic into a single screen file.  
3. **Context Awareness:** Always check AuthContext.js and ChatContext.js first. If a function exists there (like createRoster), use it. Do not re-implement API calls inside UI components.

## **Platform Documentation**

For specific setup instructions, build commands, and platform-unique constraints, refer to the dedicated READMEs:

* **Web App Documentation** (./web/README.md)  
  * Browser constraints (CORS, DOM)  
  * CSS Modules & Responsive Design  
  * Deployment to Firebase Hosting  
* **Mobile App Documentation** (./mobile/README.md)  
  * React Native Environment Setup  
  * Native Modules (Camera, Gallery, Safe Area)  
  * iOS/Android Build & TestFlight Deployment

## **Database & Security Model**

The app utilizes a strict **"Owner/Manager"** security model enforced by Firestore Rules (web/src/config/firebase/firestore.rules).  
The CRUD-to-Rule Principle:  
Whenever you implement a new feature involving Create, Read, Update, or Delete operations, you must verify firestore.rules to ensure permissions are granted.

| Feature | Collection | Read Access | Write Access |
| :---- | :---- | :---- | :---- |
| **User Profiles** | users | Public (Authenticated) | Owner Only |
| **Rosters** | rosters | Public (Authenticated) | Managers Only |
| **Chats** | chats | Participants Only | Participants Only |
| **Groups** | groups | Members Only | Members Only |
| **Feedback** | feedback | Public (Authenticated) | Creator (Create), All (Vote) |

## **Global Quick Start**

1. **Clone the Repository:**  
   git clone \[repo-url\]

2. **Environment Setup:**  
   * Navigate to web/ and create a .env file (see web/.env.example).  
   * *Note:* The mobile app currently shares the Firebase configuration via mobile/src/lib/firebase.js. Ensure this matches your .env values.  
3. **Install All Dependencies:**  
   \# Web  
   cd web  
   npm install

   \# Mobile  
   cd ../mobile  
   npm install  
   cd ios  
   pod install  \# (Mac Only \- Required for Native Modules)

4. **Launch:**  
   * **Web:** cd web && npm start  
   * **Mobile:** cd mobile && npm run ios (or android)