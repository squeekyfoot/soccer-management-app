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
| **System Notification** | A transient alert alerting users to status changes or actions needed. | `Offer Accepted`, `Offer Rejected`, `New Referral` |

---

## **2\. The Scenario Matrix**

Use this matrix to validate that the application is functioning correctly. Each scenario describes an action a user takes and the specific outcome that confirms success.

### **Role: Standard User (Player / Fan)**

*Everyone starts here. These flows cover identity, discovery, communication, and the Free Agency tools.*

| Feature Area | Scenario (Action) | Expected Outcome | Critical Path? |
| :---- | :---- | :---- | :---- |
| **Auth** | **New User Sign Up** | User enters email/pass + Sex/DOB; Account created; Redirected to Dashboard. | ✅ |
|  | **Existing User Login** | User logs in; Session restores; "My Teams" list loads immediately. | ✅ |
| **Dashboard** | **View Home Dashboard** | User sees 4-section grid (Actions, Updates, Events, Opportunities). | ✅ |
|  | **Invite Received** | Player logs in after receiving an Invite; "Actions Needed" card shows "Request" item. | ✅ |
| **Profile** | **Update Sports Info** | User updates sport-specific profile (Positions, Skill); Data persists in `users/{id}/soccerProfile`. | ✅ |
|  | **Edit Personal Info** | User attempts to edit Sex/DOB; Fields are locked if already set; Can edit Contact Info. |  |
| **Free Agency** | **Toggle Free Agent ON** | User toggles status with all required fields; Profile becomes visible in "Find Players". | ✅ |
|  | **Toggle Blocked** | User attempts to toggle status with missing data; UI shows error/validation message. |  |
| **Discovery** | **Find Teams** | User browses "Find Teams"; Sees open rosters; "Request to Join" button functions. | ✅ |
|  | **Find Players** | User visits "Community > Find Players"; List of active Free Agents is displayed. | ✅ |
| **Roster Mgmt** | **Accept Team Invite** | Player accepts invite; Added to `rosters/{id}`; Added to Team Chat; Manager notified. | ✅ |
|  | **Reject Team Invite** | Player rejects invite (optional msg); Manager receives "Notifications" alert with reason. | ✅ |
| **Messaging** | **Send Team Chat** | User sends text in Team Chat; Message appears instantly for all other active members. | ✅ |

### **Role: Team Manager**

*Requires Manager permissions (often verified via firestore.rules).*

| Feature Area | Scenario (Action) | Expected Outcome | Critical Path? |
| :---- | :---- | :---- | :---- |
| **Creation** | **Create New Roster** | Manager submits Roster Form; New document created; Appears in Dashboard. | ✅ |
| **Recruiting** | **Open Invite Modal** | Manager clicks "Invite" on a Free Agent; Modal opens with filtered team list (excludes already invited). | ✅ |
|  | **Send Invite** | Manager sends request; "Invite Sent" notification appears; Button updates to reflect status. | ✅ |
|  | **Withdraw Invite** | Manager clicks "Withdraw" on a pending player; Modal confirms; Request deleted. |  |
| **Roster Mgmt** | **Incoming Requests** | Manager sees badge/list of pending players; Can view player profile. | ✅ |
|  | **Accept Player** | Manager clicks "Accept"; Player moves to Active list; Player gains Chat access. | ✅ |
|  | **Remove Player** | Manager removes active player; Player removed from Roster AND Chat; System message posted. |  |
| **Admin** | **Dashboard View** | Manager loads Dashboard; Sees high-level stats or list of all managed teams. |  |
| **Notifications** | **View Rejection** | Manager views "Notifications"; Sees "DECLINED" badge and optional reason from player. |  |

---

## **3\. End-to-End (E2E) Test Script**

Perform this "Day in the Life" walkthrough manually before major releases (e.g., submitting to the App Store).  
**Prerequisite:** Have two devices or two browser windows (Incognito) open.  

**Step 1: The Rookie (User A)**
1. Sign up as a new user (test\_rookie@example.com).  
2. Go to **Profile** \-\> **Sports Details** \-\> Fill required fields.  
3. **Action:** Toggle "Free Agent Status" to ON.  

**Step 2: The Boss (User B \- Manager)**
1. Log in as the Manager.  
2. Navigate to **Community -> Find Players**.  
3. **Verify:** You see the "Rookie" in the list.  
4. **Action:** Click "Invite to Team", select a team, send message.  
5. **Verify:** System Notification "Invite sent successfully" appears.  

**Step 3: The Handshake**
1. Switch back to **User A**.  
2. **Verify:** Dashboard "Actions Needed" shows 1 Request.  
3. **Action:** Click "Accept".  
4. **Verify:** You are redirected or see the new Team in "My Teams".  
5. **Verify:** Navigate to **Messaging**, you are now in the Team Chat with a "Joined" system message.

---

## **4\. Protocol: Defining New Features**

### **The "Feature Brief" Template**
**1\. Feature Name:** (e.g., "Event Scheduling") **2\. Role:** (Who is this for?)  
**3\. The Scenario:** "As a Manager, I want to create a practice event..."  
**4\. Expected Outcomes:**
* [ ] Manager can select Date/Time.  
* [ ] Event appears in Calendar.  

### **When to Update This Document**
* **Update:** When a PR is merged that introduces a user-facing change.  
* **Audit:** If a feature is deprecated or behavior changes significantly.