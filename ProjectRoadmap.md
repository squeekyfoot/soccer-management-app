# **Project Roadmap**

This document tracks the development priorities for the Soccer Team App.

## **Phase 1: Security & Foundation (Immediate)**

* \[ \] **Fix Privacy Flaws (Firestore Rules)**  
  * \[ \] Disable public read access to the users collection.  
  * \[ \] Restrict write access so users can only edit their own documents.  
  * *Action:* Copy the code from firestore.rules into the Firebase Console.  
* \[ \] **Modular Code Refactor**  
  * \[ \] Break App.js into smaller components (AuthPage, MyProfile, SportsInfo).  
  * \[ \] Create AuthContext.js to manage state globally.  
  * \[ \] Ensure App.js acts only as a router.

## **Phase 2: Role-Based Access Control (RBAC)**

* \[ \] **Data Model Update**  
  * \[ \] Add role field to user documents (values: 'player', 'manager', 'staff').  
  * \[ \] Set default role to 'player' on sign-up.  
* \[ \] **RBAC Security Rules**  
  * \[ \] Add Firestore rule to prevent users from modifying their own role field.  
  * \[ \] Add Firestore rule to allow Managers to read/write to rosters.  
* \[ \] **UI Logic for Roles**  
  * \[ \] Update AuthContext to check user roles.  
  * \[ \] Create ManagerDashboard component.  
  * \[ \] Update Layout to route users to the correct dashboard based on role.

## **Phase 3: Manager Features**

* \[ \] **Roster Management**  
  * \[ \] Create rosters collection in Firestore.  
  * \[ \] Build UI for Managers to create/edit rosters.  
  * \[ \] Allow Managers to assign Players to Rosters.