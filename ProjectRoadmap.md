# **Project Roadmap**

## **Phase 1: Security & Foundation (Completed)**

* \[x\] **Fix Privacy Flaws:** Firestore rules locked down.  
* \[x\] **Modular Refactor:** App split into Context/Components.  
* \[x\] **Secure Deployment:** Environment variables set up.

## **Phase 2: Role-Based Access Control (Completed)**

* \[x\] **Data Model & Security:** role field protected.  
* \[x\] **Manager Dashboard:** Basic UI created.

## **Phase 3: Advanced Roster Management (Completed)**

* \[x\] **Roster Detail View:** View specific roster details.  
* \[x\] **Player Assignment:** Add/Remove players by email.  
* \[x\] **Player Roster View:** Players can see their teams (MyTeams).

## **Phase 4: Personal Schedule & Community Events (CURRENT PRIORITY)**

*Goal: Allow the community to self-organize practices/events and see a unified calendar.*

* \[ \] **Security Update:**  
  * Relax rules so **any** team member (Player or Manager) can create an event for their team.  
* \[ \] **Event Data Model:**  
  * eventType: "Practice" | "Morale" (Games are reserved for future Facility logic).  
  * rosterId: Link event to a specific team.  
* \[ \] **"My Schedule" Logic:**  
  * Create a query to fetch ALL events from ALL teams a user belongs to.  
* \[ \] **Calendar UI:**  
  * Build a visual Month View calendar.  
  * Highlight "Today".  
  * Show events as dots or bars on the relevant days.  
  * Allow clicking a day to see details.

## **Phase 5: Team Communication**

* \[ \] **Roster Chat**