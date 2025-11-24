# **Soccer Team Management App**

This is a community-driven sports team management application designed to help players, managers, and communities coordinate rosters, schedules, and communication.

## **Architecture Overview**

The project is built as a **Single Page Application (SPA)** using React. It relies heavily on a **Context-based architecture** where a single "Brain" (AuthContext.js) manages the global state and API calls, while smaller "dumb" components handle the UI.

### **Core Technology Stack**

* **Frontend:** React (Create React App)  
* **Backend:** Firebase (Serverless)  
  * **Authentication:** Manages users (Email/Password).  
  * **Firestore Database:** Stores all structured data (profiles, rosters, chats).  
  * **Storage:** Stores user-uploaded media (profile pictures, chat images).  
  * **Hosting:** Serves the web app globally.  
* **Styling:** Custom CSS (responsive grid/flexbox system).  
* **Icons:** lucide-react library.

## **Directory Structure & File Guide**

### **Root Configuration**

* **firebase.js**: The bridge to Firebase. It initializes the app using environment variables and exports the auth, db (Firestore), and storage services. It uses a "Singleton Pattern" to prevent duplicate initialization errors during development.  
* **index.js**: The entry point. It wraps the entire \<App /\> in the \<AuthProvider\> so that state is available globally.

### **The Brain (State Management)**

* **src/context/AuthContext.js**: This is the most critical file. It contains **all** the business logic and state management.  
  * **State:** Holds loggedInUser, soccerDetails, needsReauth, etc.  
  * **Auth Functions:** signIn, signUp, signOutUser, updateProfile.  
  * **Roster Logic:** createRoster, addPlayerToRoster, fetchRosters.  
  * **Event Logic:** createEvent, fetchEvents (Master Schedule).  
  * **Chat Logic:** createChat, sendMessage, fetchUserChats (Real-time).  
  * **Group Logic:** createGroup, addGroupMembers, updateGroupMemberRole.

### **The Router & Layout**

* **src/App.js**: Acts as the main router. It checks if a user is logged in and decides whether to show the AuthPage (Sign In/Up) or the main Layout. It also handles global listeners like beforeunload cleanup.  
* **src/components/Layout.js**: Defines the main shell of the app.  
  * **Desktop:** Shows a persistent sidebar navigation on the left.  
  * **Mobile:** Shows a top header and a bottom tab bar navigation.  
  * **Routing:** Decides which "Page Component" (Home, Messaging, etc.) to render in the main content area.

### **Page Components (The Views)**

These components correspond to the main navigation buttons.

1. **src/components/Home.js**: The default dashboard.  
   * Combines the **Calendar View** and **My Rosters** list into a single view.  
2. **src/components/Groups.js**: Manages community groups that span across teams.  
   * Features: Create Group, Feed (Posts), About, and Member Management (Promote/Demote/Remove).  
3. **src/components/TeamChat.js**: The messaging center.  
   * **Left Column:** Real-time list of active conversations (DMs and Groups).  
   * **Right Column:** The active chat window or the "New Chat" creation flow.  
   * **Features:** Image uploads, real-time updates, "New Chat" user search.  
4. **src/components/MyProfile.js**: The user's personal settings.  
   * Displays and edits profile details (Name, Phone, Address).  
   * Manages Profile Picture (upload/delete).  
   * Embeds the **Sports Info** form.  
5. **src/components/ManagerDashboard.js**: (Manager Role Only)  
   * Allows creation and deletion of Team Rosters.  
   * Allows adding players to rosters via email search.

### **Sub-Components & Utilities**

* **src/components/SportsInfo.js**: A sub-form used inside the Profile page to handle soccer-specific data (Jersey size, position, etc.).  
* **src/components/UserSearch.js**: A reusable component that provides a "Typeahead" search to find users by name or email. Used in Chat and Groups.  
* **src/components/CalendarView.js**: Renders the visual month grid and list of upcoming events. Used in Home.  
* **src/components/ReauthModal.js**: A popup modal that appears when a sensitive action (like changing email) requires the user to re-enter their password.

## **Security Rules (Firestore)**

The app uses a strict "Owner/Manager" security model enforced by Firestore Rules (firestore.rules).

* **Users:** Only the owner can edit their profile. Everyone can read profiles (for search).  
* **Rosters:** Only Managers can create/edit rosters. Everyone can read.  
* **Chats:** Only participants of a chat (listed in the participants array) can read or write messages.  
* **Groups:** Members can read/post. Only Owners/Admins can manage members.  
* **Events:** Any team member can create an event for their team.

## **Development Setup**

### **Prerequisites**

* Node.js & npm  
* Firebase CLI (npm install \-g firebase-tools)

### **Installation**

1. Clone the repository.  
2. Run npm install to install dependencies.  
3. Create a .env file in the root with your Firebase keys (see .env.example).

### **Running Locally**

npm start

Runs the app in development mode. Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) to view it in your browser.

### **Deployment**

npm run build  
firebase deploy

Builds the app for production to the build folder and deploys it to Firebase Hosting.