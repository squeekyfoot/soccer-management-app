# **Architecture Guide**

To keep the codebase manageable, we use a Component-Based Architecture.  
We avoid putting all logic in App.js.

## **Directory Structure**

src/  
├── context/  
│   └── AuthContext.js    \<-- The "Brain" (State & Logic)  
├── components/  
│   ├── AuthPage.js       \<-- Sign In / Sign Up Forms  
│   ├── Layout.js         \<-- Sidebar/Tab Bar & Main Wrapper  
│   ├── MyProfile.js      \<-- View & Edit Profile  
│   ├── SportsInfo.js     \<-- View & Edit Sports Data  
│   ├── ManagerDashboard.js \<-- (Future) Manager Tools  
│   └── ReauthModal.js    \<-- Security Modal  
├── App.js                \<-- The Router (Decides what to show)  
└── firebase.js           \<-- Database Config

## **How to Modify Features**

### **If you want to change HOW data is saved (Logic):**

* **Edit:** src/context/AuthContext.js  
* This file contains the signIn, signUp, and updateProfile functions.

### **If you want to change HOW the form looks (UI):**

* **Edit:** The specific component in src/components/ (e.g., MyProfile.js).  
* These files handle the HTML (JSX) and local form state.

### **If you want to change WHERE users go (Routing):**

* **Edit:** src/App.js or src/components/Layout.js.  
* These files control the navigation logic.