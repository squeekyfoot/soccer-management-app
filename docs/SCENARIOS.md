# **App Scenarios & Product Manual**

**Last Updated:** [Current Date]  
**Purpose:** This document serves as the "Source of Truth" for User Acceptance Testing (UAT) and Quality Assurance (QA). It details every supported user flow to ensure that key outcomes are achievable across both Web and Mobile platforms.

## **1\. Core Concepts & Business Entities**

Before diving into specific scenarios, it's crucial to understand the core "nouns" of the application. These are the primary data objects, or **Business Entities**, that all features and user actions revolve around. Each entity will have its own dedicated "Brain" (`use...Manager.js` hook) as per the `RefactorStrategy.md`.

### **Primary Entities**

| Entity | Description | Key Scenarios & Features |
| :--- | :--- | :--- |
| **User / Profile** | The record for an individual person. Holds identity, auth details, and personal info. | `New User Sign Up`, `Edit "My Profile"`, `Search for Users` |
| **Team / Roster** | The central organizing unit for players. Has members, capacity, and links to other entities. | `Create New Roster`, `Find Teams`, `Edit Roster Details`, `Accept Player` |
| **Chat / Message** | A communication channel (`Chat`) and the individual messages within it. Can be 1:1, group, or team-wide. | `Send Team Chat`, `Direct Message`, `Create Group Chat` |
| **League** | A container for a season or competition with start/end dates. Teams can be linked to a league. | `Create League`, `links Roster to a League` |

### **Secondary & Transient Entities**

| Entity | Description | Key Scenarios & Features |
| :--- | :--- | :--- |
| **Join Request** | A temporary record representing a user's request to join a team. Has a status (pending, accepted, etc.). | `Incoming Requests`, `Accept Player`, `Reject Player` |
| **Event** | A scheduled occurrence like a practice or game with a time and location. | `Event Scheduling` (from Feature Brief) |
| **Community Group** | A social space, distinct from a competitive team, that users can join to access a feed. | `Join Group`, `Manage Connections` |
| **Feedback Item** | A feature request or suggestion submitted by a user, which can then be voted on. | `Submit Feedback` |

---

## **2\. The Scenario Matrix**

Use this matrix to validate that the application is functioning correctly. Each scenario describes an action a user takes and the specific outcome that confirms success.

### **Role: Standard User (Player / Fan)**

*Everyone starts here. These flows cover identity, discovery, and communication.*

| Feature Area | Scenario (Action) | Expected Outcome | Critical Path? |
| :---- | :---- | :---- | :---- |
| **Auth** | **New User Sign Up** | User enters valid email/pass; Account created in Firebase; Redirected to Home Dashboard. | ✅ |
|  | **Existing User Login** | User logs in; Session restores; "My Teams" list loads immediately. | ✅ |
|  | **Re-Authentication** | User changes sensitive setting; Prompts for login; Action succeeds after verification. |  |
| **Dashboard** | **View Home Dashboard** | User sees 4-section grid (Actions, Updates, Events, Opportunities) with accurate counts. | ✅ |
|  | **View Dashboard Details** | Clicking a dashboard card (e.g., "Actions Needed") opens a list view of specific items. |  |
| **Profile** | **Edit "My Profile"** | User changes Avatar/Name; Header and Sidebar update immediately without refresh. |  |
|  | **Update Sports Info** | User adds "Goalkeeper" to Soccer profile; Data persists in users/{id} collection. |  |
| **Discovery** | **Search for Users** | User types name in Search; List renders matching users; Clicking result opens Public Profile. |  |
|  | **Find Teams** | User browses "Find Teams"; Sees open rosters; "Request to Join" button functions. | ✅ |
| **Messaging** | **Send Team Chat** | User sends text in Team Chat; Message appears instantly for all other active members. | ✅ |
|  | **Share Image** | User selects image; Image compresses (client-side); Uploads & renders in chat stream. |  |
|  | **Direct Message** | User clicks "Message" on a profile (e.g. in Roster list); Private 1:1 chat thread opens immediately. |  |
|  | **Create Group Chat** | User creates chat with selected members; New independent chat created (does not redirect to existing Team Chat). |  |
| **Community** | **Join Group** | User clicks "Join" on a Community Group; Access granted to group feed. |  |
|  | **Submit Feedback** | User submits feature request; Item appears in "Feedback" list for voting. |  |

### **Role: Team Manager**

*Requires Manager permissions (often verified via firestore.rules).*

| Feature Area | Scenario (Action) | Expected Outcome | Critical Path? |
| :---- | :---- | :---- | :---- |
| **Creation** | **Create New Roster** | Manager submits Roster Form; New document created in rosters collection; Appears in Dashboard. | ✅ |
|  | **Create League** | Manager creates a League (Season dates, frequency); League becomes available for linking. |  |
| **Roster Mgmt** | **Edit Roster Details** | Manager updates capacity, toggles "Looking for Players", or links Roster to a League. |  |
|  | **Manage Connections** | Manager links/unlinks a Community Group; Roster Details update to show linked status. |  |
|  | **Recreate Team Chat** | Manager clicks "Recreate"; Old chat archived; New chat created with current players & notification. |  |
|  | **Incoming Requests** | Manager sees badge/list of pending players; Can view player profile. | ✅ |
|  | **Accept Player** | Manager clicks "Accept"; Player moves to Active list; Player gains Chat access. | ✅ |
|  | **Reject Player** | Manager clicks "Reject"; Request document deleted; Player removed from list. |  |
|  | **Remove Player** | Manager removes active player; Player immediately loses access to Team Chat. |  |
| **Admin** | **Dashboard View** | Manager loads Dashboard; Sees high-level stats or list of all managed teams. |  |

### **Role: Cross-Platform Parity**

*Ensures the "Law of Parity" is respected between Web and Mobile.*

| Platform | Scenario (Action) | Expected Outcome |
| :---- | :---- | :---- |
| **Mobile Web** | **Viewport Resize** | Accessing site on phone (\<768px) hides Sidebar and shows Bottom Tab Bar. |
| **Native App** | **Navigation** | Swiping "Back" on iOS (Stack Navigator) returns to previous screen smoothly. |
| **Native App** | **Keyboard Input** | Tapping input field slides keyboard up; KeyboardAvoidingView prevents UI obstruction. |
| **Native App** | **Dashboard Layout** | Home Dashboard cards stack vertically (Flex column) instead of grid to fit screen width. |

## **3\. End-to-End (E2E) Test Script**

Perform this "Day in the Life" walkthrough manually before major releases (e.g., submitting to the App Store).  
**Prerequisite:** Have two devices or two browser windows (Incognito) open.  
**Step 1: The Rookie (User A)**

1. Sign up as a new user (test\_rookie@example.com).  
2. Go to **Profile** \-\> Upload a random photo as Avatar.  
3. **Verify:** Dashboard "Actions Needed" shows tasks (e.g., "Add Emergency Contact").  
4. Go to **Find Teams** \-\> Search for an existing team (or create one if empty).  
5. **Action:** Submit a "Join Request" to a team.

**Step 2: The Boss (User B \- Manager)**

1. Log in as the Manager of the team above.  
2. Navigate to **Manager Dashboard**.  
3. **Verify:** You see the request from test\_rookie.  
4. **Action:** Accept the request.  
5. Navigate to **Messaging** \-\> Open Team Chat.  
6. **Action:** Send text: "Welcome to the team\!".

**Step 3: The Handshake**

1. Switch back to **User A**.  
2. **Verify:** The Team now appears in your "My Teams" list.  
3. **Verify:** You see the "Welcome" message in the chat.  
4. **Action:** Reply with an image from your gallery.  
5. **Verify:** Image loads correctly on both screens.

## **4\. Protocol: Defining New Features**

When adding items to the product roadmap, use this template to ensure engineering and QA are aligned **before** code is written.

### **The "Feature Brief" Template**

**1\. Feature Name:** (e.g., "Event Scheduling") **2\. Role:** (Who is this for? e.g., Manager) **3\. The Scenario (User Story):** "As a Manager, I want to create a practice event with a time and location, so that players know when to show up."  
**4\. Expected Outcomes (Acceptance Criteria):**

* [ ] Manager can select Date/Time via a picker.  
* [ ] Event appears in the "Calendar" view for all roster members.  
* [ ] Players receive a notification (or see a badge) for the new event.

**5\. Parity Check:**

* **Web UI:** Sidebar Link \-\> Calendar View \-\> "Add Event" Modal.  
* **Mobile UI:** Tab Bar (Home) \-\> Calendar Tab \-\> Floating Action Button (+).

### **When to Update This Document**

* **Update:** When a PR is merged that introduces a user-facing change.  
* **Audit:** If a feature is deprecated or behavior changes significantly.

## **5\. Product Manager Best Practices**

To maintain a healthy repository and product lifecycle, perform these rituals regularly.

### **Weekly Rituals**

* **The "Parity Audit":** Open the Web App and Mobile App side-by-side. Click through 3 random screens. Do they look and feel consistent? If not, file a "Parity Debt" ticket.  
* **Feedback Review:** Check the feedback collection in the App (or Firestore). Upvote count determines the next feature to build.  
* **Error Check:** Glance at the "Empty States." If a new user signs up and has no data, does the app look broken or does it guide them (e.g., "You have no teams yet, find one here\!")?

### **Monthly Rituals**

* **Security Sweep:** Review docs/FirestoreSecurityRules.md vs the actual firestore.rules file. Did we add a feature but forget to lock it down?  
* **Dependency Audit:** Run npm audit in both web/ and mobile/. Security vulnerabilities in older packages (especially React Native ones) can block App Store approval.  
 * **Scenario Run-Through:** Execute the **E2E Test Script** (Section 3\) fully to ensure core loops aren't broken.

## **6\. Appendix: Critical Path Definition**

The "Critical Path" designation (✅) in the Scenario Matrix is not arbitrary. It is assigned based on a strict set of criteria that defines the minimum viability of the product.

### **1\. The Definition Criteria**

A scenario is marked as **Critical Path** if it meets at least one of the following conditions:

1. **Blocker Severity:** Failure here renders 100% of the app's other features inaccessible (e.g., *Login*).  
2. **Value Core:** This is the primary utility the user installed the app for (e.g., *Chatting*).  
3. **Viral Loop:** This action connects users to each other, fueling growth (e.g., *Joining a Team*).

### **2\. Justification for Critical Scenarios**

| Scenario | Classification | Why it is Critical |
| :---- | :---- | :---- |
| **Auth (Sign Up / Login)** | **Blocker** | The "Gatekeeper." If this fails, the user cannot access any part of the application. |
| **Find Teams / Join** | **Viral Loop** | The "Connection." A user with an account but no team has no utility. This connects the graph. |
| **Send Team Chat** | **Value Core** | The "Retention Hook." Daily communication is the primary use case. Failure here causes immediate churn to external tools (WhatsApp/SMS). |
| **Manager: Create Roster** | **Content Seed** | Without Rosters, there are no containers for players to join. The ecosystem cannot start without this. |
| **Manager: Accept Player** | **Handshake** | Completes the viral loop initiated by "Find Teams." If broken, the network effect halts. |
| **View Home Dashboard** | **Value Core** | The "Command Center." If this fails, the user cannot orient themselves or see alerts, breaking the daily loop. |