# **Soccer Team Management App**

This is a community-driven sports team management application designed to help players, managers, and communities coordinate rosters, schedules, and communication.

## **Architecture Overview**

The project is built as a **Single Page Application (SPA)** using React. It utilizes a **Context-based architecture** to manage global state. 

Originally built with a single "God Object" context, the application has been refactored to separate concerns into domain-specific contexts:
1.  **AuthContext:** Manages User Identity (Who are you?) and Roster/Event data.
2.  **ChatContext:** Manages Real-time Messaging (Who are you talking to?).

The UI is built using a "Container/Presentation" pattern where parent components (like `TeamChat.js`) handle logic/state, and child components (like `MessageList.js`) simply render data.

### **Core Technology Stack**

* **Frontend:** React (Create React App)
* **Backend:** Firebase (Serverless)
  * **Authentication:** Manages users (Email/Password).
  * **Firestore Database:** Stores all structured data (profiles, rosters, chats).
  * **Storage:** Stores user-uploaded media (profile pictures, chat images).
  * **Hosting:** Serves the web app globally.
* **Styling:** Custom CSS with a centralized Design System (`src/constants.js`).
* **Icons:** lucide-react library.

---

## **Directory Structure & File Guide**

### **1. Configuration & State (The Brains)**

* **`src/constants.js`**: **Single Source of Truth.** Contains global configuration for:
  * **Colors:** (`COLORS.primary`, `COLORS.background`, etc.)
  * **Layout:** (`MOBILE_BREAKPOINT`) to ensure consistent responsive behavior.
* **`src/context/AuthContext.js`**: Manages **Identity & Data**.
  * Handles Login/Signup/Logout.
  * Fetches Rosters, Events, and User Profiles.
* **`src/context/ChatContext.js`**: Manages **Communication**.
  * Listens for real-time chat updates (`myChats`).
  * Handles message lifecycle: `sendMessage`, `markChatAsRead`.
  * Handles group management: `createChat`, `addParticipant`, `leaveChat`, `updateGroupPhoto`.
  * Manages history visibility logic (`hiddenHistory`) for new members.

### **Utility Functions**

* **`src/utils/imageUtils.js`**: Handles client-side image compression. Used to resize avatar and attachment images before uploading to Firebase Storage to improve performance and reduce bandwidth.

### **2. Common UI (The Design System)**

Located in **`src/components/common/`**. These are reusable "dumb" components that enforce styling consistency.

* **`Button.js`**: Standardized buttons with variants (`primary`, `secondary`, `danger`).
* **`Input.js`**: Standardized text inputs that handle mobile-specific quirks (like font-size scaling).

### **3. The Router & Layout**

* **`src/App.js`**: The main entry point. It decides whether to render the `AuthPage` or the main `Layout` based on login status.
* **`src/components/Layout.js`**: The application shell.
  * **Desktop:** Renders a persistent left sidebar.
  * **Mobile:** Renders a top header and bottom tab bar.
  * **Navigation:** Connects to `ChatContext` to display unread notification badges.

### **4. Feature Components (The Views)**

* **`src/components/Home.js`**: The dashboard. Combines `CalendarView` and `MyTeams`.
* **`src/components/Groups.js`**: Community groups for posts/feeds.
* **`src/components/MyTeams.js`**: Teams that the user is apart of and actions needed to be taken.
* **`src/components/MyProfile.js`**: User settings and profile picture management.
* **`src/components/Feedback.js`**: A page dedicated to providing feedback and issues on the app being developed - only intended for use during development.
* **`src/components/ManagerDashboard.js`**: Admin tools for creating rosters and inviting players.

### **5. Messaging System (TeamChat)**

The chat system is split into specialized sub-components in **`src/components/chat/`**:

* **`TeamChat.js` (Controller):** The parent container. It connects to the Contexts, manages local state (selected chat), and orchestrates the sub-components.
* **`ChatList.js`:** The left-hand list of conversations. Displays user avatars and unread badges using a 3-column grid layout.
* **`ChatHeader.js`:** The top bar showing the active chat name, avatar, and action menu.
* **`MessageList.js`:** The scrolling history area. Handles "Auto-Scroll" logic and layout stability.
* **`MessageInput.js`:** The bottom form for typing and attaching images.
* **`ChatDetailsModal.js`**: A modal interface for managing chat settings. Handles renaming groups, updating group photos, adding members, and leaving groups.
* **`ImageViewer.js`:** A portal-based modal for viewing full-screen images.

---

## **Refactoring & Maintenance Guidelines**

To keep the codebase clean and efficient, follow these principles when adding new features:

1.  **No Magic Numbers/Strings:**
    * Do not write `768` or `#61dafb` in your components. Import them from `src/constants.js`.
2.  **Separation of Concerns:**
    * **Data Logic** goes in a Context (`AuthContext` or `ChatContext`).
    * **UI Logic** goes in a Component.
    * If a component file exceeds ~200 lines, try to extract sub-components (e.g., how we extracted `MessageInput`).
3.  **Use Common Components:**
    * Always use `<Button />` and `<Input />` instead of raw HTML tags to ensure mobile compatibility and visual consistency.
4.  **Mobile First:**
    * Always test layout changes against `MOBILE_BREAKPOINT`.
    * Remember that mobile browsers behave differently (e.g., address bars, keyboard zooming).
5.  **Performance Optimization:**
    * Use `React.memo` for list items (like `ChatListItem`) to prevent "render storms" in large lists.
    * Use `requestAnimationFrame` for scroll adjustments to avoid forced reflows.
    * Compress images client-side (`imageUtils.js`) before uploading.

---

## **Security Rules (Firestore)**

The app uses a strict "Owner/Manager" security model enforced by Firestore Rules (`firestore.rules`).

* **Users:** Only the owner can edit their profile. Everyone can read profiles (for search).
* **Rosters:** Only Managers can create/edit rosters. Everyone can read.
* **Chats:** Only participants of a chat (listed in the participants array) can read or write messages.
* **Groups:** Members can read/post. Only Owners/Admins can manage members.

---

## **Development Setup**

### **Prerequisites**
* Node.js & npm
* Firebase CLI (`npm install -g firebase-tools`)

### **Installation**
1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Create a `.env` file in the root with your Firebase keys (see `.env.example`).

### **Running Locally**
```bash
npm start
```
Runs the app in development mode. Open http://localhost:3000 to view it in your browser.

### **Deployment**
```bash
npm run build
firebase deploy
```
Builds the app for production to the build folder and deploys it to Firebase Hosting.