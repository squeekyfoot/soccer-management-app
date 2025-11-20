# **Project Roadmap**

## **Phase 1: Security & Foundation (Completed)**

* \[x\] **Fix Privacy Flaws:** Firestore rules locked down to "Owner Only".  
* \[x\] **Modular Refactor:** App split into Context/Components architecture.  
* \[x\] **Secure Deployment:** Environment variables set up for public repo safety.

## **Phase 2: Role-Based Access Control (Completed)**

* \[x\] **Data Model:** Added role field ('player', 'manager').  
* \[x\] **Security Rules:** Protected role field from tampering.  
* \[x\] **Manager Dashboard:** Created basic UI for creating/viewing rosters.

## **Phase 3: Advanced Roster Management (CURRENT PRIORITY)**

*Goal: Turn the "Roster" from a simple text list into a functional team container.*

* \[ \] **Roster Detail View:**  
  * Create a view to click into a specific roster and see its details.  
* \[ \] **Player Assignment:**  
  * Build a "Search for Player" feature (by email).  
  * Add logic to link a Player's UID to a Roster's playerIDs array.  
  * **Constraint:** Ensure a player can only be added if they exist in the users collection.  
* \[ \] **Player Roster View:**  
  * Update MyProfile or SportsInfo so regular players can see which team(s) they are on.

## **Phase 4: Event Management (Next Up)**

*Goal: Schedule games and track who is coming.*

* \[ \] **Event Creation:**  
  * Allow Managers to create "Events" (Games/Practices) linked to a specific Roster.  
  * Fields: Date, Time, Location, Opponent.  
* \[ \] **RSVP System:**  
  * Allow Players to mark "Attending", "Not Attending", or "Maybe" for events.  
  * Show Managers a tally of attendance.

## **Phase 5: Team Communication**

* \[ \] **Roster Chat:**  
  * Create a real-time chat room restricted to members of a specific Roster.