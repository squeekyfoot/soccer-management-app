# **My Team App (Web)**

This document describes the project structure, file by file, to help new developers and to maintain context for AI-assisted development.  
This project is built with React and Firebase, and it uses a **Context-based architecture** to manage application state.

## **Project Structure Overview**

my-team-app/  
├── public/  
├── src/  
│   ├── components/  
│   │   ├── AuthPage.js  
│   │   ├── Layout.js  
│   │   ├── MyProfile.js  
│   │   ├── ReauthModal.js  
│   │   └── SportsInfo.js  
│   ├── context/  
│   │   └── AuthContext.js  
│   ├── App.js  
│   ├── App.css  
│   ├── firebase.js  
│   └── index.js  
├── .firebaserc  
├── firebase.json  
├── package.json  
└── README.md (This file)

## **Core Files & Components**

### **1\. src/firebase.js**

* **Purpose:** Initializes and configures the connection to your Firebase project.  
* **Key Responsibilities:**  
  * Holds your secret firebaseConfig keys.  
  * Initializes the Firebase app.  
  * Exports the auth (Authentication) and db (Firestore) services for the rest of the app to use.

### **2\. src/index.js**

* **Purpose:** The main entry point for the React application.  
* **Key Responsibilities:**  
  * Finds the \<div id="root"\> in the public/index.html file.  
  * **Wraps the entire \<App /\> component in the \<AuthProvider\>.** This is critical, as it makes the "brain" (AuthContext) available to every other component.

### **3\. src/context/AuthContext.js (The "Brain")**

* **Purpose:** This is the most important file. It's a global "provider" that holds all the application's *global state* and the *functions* to change that state.  
* **Key Responsibilities:**  
  * **Global State:** loggedInUser, soccerDetails, isLoading, needsReauth.  
  * **Global Functions:** signIn, signUp, signOutUser, updateProfile, reauthenticate, updateSoccerDetails.  
  * **Auth Listener:** Contains the onAuthStateChanged hook that checks if a user is logged in when the app first loads.  
  * **useAuth() Hook:** Exports a custom hook so components can easily access this data (e.g., const { signIn } \= useAuth();).

### **4\. src/App.js (The "Router")**

* **Purpose:** This file is no longer a "God Component." It is now a simple "router."  
* **Key Responsibilities:**  
  * Uses the useAuth() hook to check isLoading and loggedInUser.  
  * Renders a "Loading..." message if isLoading is true.  
  * Renders the \<ReauthModal /\> component if needsReauth is true.  
  * Renders **\<Layout /\>** if a user is logged in.  
  * Renders **\<AuthPage /\>** if no user is logged in.

## **Components (src/components/)**

### **5\. src/components/AuthPage.js**

* **Purpose:** The main "logged out" page.  
* **Key Responsibilities:**  
  * Renders the "Sign In" form.  
  * Renders the "Sign Up" form.  
  * Holds the **local state** for the form inputs (e.g., email, password, playerName).  
  * Calls the signIn() and signUp() functions (from the "brain") when the forms are submitted.

### **6\. src/components/Layout.js**

* **Purpose:** The main "logged in" view. This component holds the persistent navigation and content area.  
* **Key Responsibilities:**  
  * Holds the **local state** for isMobile and activeView (which page is showing).  
  * Renders the responsive navigation (desktop sidebar or mobile top/bottom bars).  
  * Renders the correct "page" component (\<MyProfile /\> or \<SportsInfo /\>) based on the activeView state.  
  * Calls the signOutUser() function from the "brain."

### **7\. src/components/MyProfile.js**

* **Purpose:** Shows and edits the user's main profile.  
* **Key Responsibilities:**  
  * Gets loggedInUser from the useAuth() hook to *display* the data.  
  * Holds **local state** for isEditingProfile and profileFormData.  
  * Renders the profile in "view mode" (using the .info-table layout).  
  * Renders the "edit profile" form when isEditingProfile is true.  
  * Calls the updateProfile() function from the "brain" when the form is submitted.

### **8\. src/components/SportsInfo.js**

* **Purpose:** Shows and edits the user's soccer-specific info.  
* **Key Responsibilities:**  
  * Gets soccerDetails from the useAuth() hook to *display* the data.  
  * Holds **local state** for isEditingSoccer and soccerFormData.  
  * Renders the "add info" prompt if soccerDetails is null.  
  * Renders the sports info in "view mode" (using the .info-table layout).  
  * Renders the "edit sports" form.  
  * Calls the updateSoccerDetails() function from the "brain" when the form is submitted.

### **9\. src/components/ReauthModal.js**

* **Purpose:** A global modal that appears *on top of* all other components when a user needs to re-authenticate (e.g., to change their email).  
* **Key Responsibilities:**  
  * Holds **local state** for the reauthPassword input.  
  * Calls the reauthenticate() function from the "brain" when submitted.  
  * Calls setNeedsReauth(false) to close itself.

### **10\. src/App.css**

* **Purpose:** A global stylesheet for the *entire application*.  
* **Key Responsibilities:**  
  * Provides all styles for the desktop sidebar, mobile header, and mobile tab bar.  
  * Provides the styles for the .info-table used in profile/sports pages.  
  * Provides basic app-wide styles (background color, text color, etc.).