# RFC: Data Access Layer (DAL) & Optimistic UI Strategy

**Status:** Proposed / Backlog  
**Goal:** Eliminate race conditions, enforce data consistency, and remove "Developer Memory" as a point of failure.

---

## 1. The Problem: "The Memory Trap" & Race Conditions

Currently, our application relies on individual developers remembering to implement specific patterns for every new feature. This has led to fragility and recurring bugs.

### Identified Issues
1.  **Race Conditions:** When a user performs an action (e.g., "Invite Player"), the UI does not immediately reflect this change. The user can click the button again before the server responds, causing duplicate data or errors.
2.  **Cognitive Load (The "Memory Trap"):** Developers must remember to use specific "Optimistic Hooks" (like `useManagerInvites`) instead of standard data hooks. If they forget, the feature works but is buggy.
3.  **Inconsistent Feedback:** Some actions show a spinner, some block the UI, and some show nothing. There is no global standard for "Pending" or "Success" states.
4.  **Fragile Security/Logic Coupling:** Logic for updating related entities (e.g., "Join Roster" -> "Add to Chat") is scattered across UI components, leading to "Chicken and Egg" permission errors.

---

## 2. The Solution: A Global Data Access Layer (DAL)

We will implement a **Centralized Data Access Layer** that sits between the React Views and the Firestore Database.

### Core Philosophy
* **Views are "Dumb":** Views never import `firebase/firestore`. They only ask the DAL to "add item" or "get list."
* **The DAL is "Smart":** The DAL automatically handles:
    * **Optimistic Updates:** Immediate UI reflection of actions.
    * **Reconciliation:** Merging server data with local pending actions to prevent "flashing."
    * **Rollbacks:** Automatically undoing changes if the server request fails.

---

## 3. Architecture & Implementation Plan

### A. The Brain: `DataContext.js`
A Global Context that tracks all "In-Flight" operations. It is the **Single Source of Truth** for the application's optimistic state.
* **State:** `pendingOps` array (Stores Adds, Removes, Updates that haven't confirmed yet).
* **Function:** `mergeData(serverData, collection)` - A helper that takes real data and overlays pending operations on top before returning it to the UI.

### B. The Tool: `useFirestore.js`
A generic, reusable hook that replaces the native Firebase SDK. **This is the only file allowed to import Firestore.**
* **`useCollection(collectionName, query)`**: Automatically subscribes to Firestore AND merges in the `pendingOps` from Context. The UI gets a seamless, race-condition-proof list.
* **`addDocument(collection, data)`**:
    1.  Adds item to `pendingOps` (UI updates instantly).
    2.  Sends request to Firestore.
    3.  On success: Removes from `pendingOps` (Server data takes over).
    4.  On fail: Removes from `pendingOps` and notifies user (Rollback).

### C. The Guardrails: Enforcing the Pattern
To prevent developers (and AI) from bypassing this system:
1.  **ESLint Rule:** Configure `no-restricted-imports` in `package.json` to flag an **Error** if `firebase/firestore` is imported anywhere except `useFirestore.js`.
2.  **Documentation:** Update `README.md` and `RefactorStrategy.md` to explicitly forbid direct database access.

---

## 4. Usage Scenarios (For Testing & Validation)

These scenarios define the success criteria for the DAL implementation.

| Scenario | Action | Expected Behavior (Optimistic) | Fallback/Error Behavior |
| :--- | :--- | :--- | :--- |
| **Sending an Invite** | Manager clicks "Invite" on a Player Card. | 1. Button immediately disables.<br>2. Player Card UI updates to "Invited".<br>3. Request is sent in background. | If server fails: UI reverts to "Invite" button; System Notification shows error. |
| **Chat Message** | User sends "Hello". | 1. Message appears in list immediately (greyed out or pending icon).<br>2. Chat List preview updates immediately. | If server fails: Message turns red with "Retry" option. |
| **Withdrawing Invite** | Manager clicks "Withdraw". | 1. Item vanishes from list instantly.<br>2. Server delete call happens in background. | If server fails: Item reappears in list; Notification alerts user. |
| **Joining a Team** | Player clicks "Accept". | 1. Team immediately appears in "My Teams".<br>2. "Actions Needed" item disappears. | If server fails: Team removed from list; Action item reappears. |

---

## 5. Migration Checklist

When we resume this work, follow this order of operations:

1.  [ ] **Create Context:** Implement `src/context/DataContext.js`.
2.  [ ] **Create Hook:** Implement `src/hooks/useFirestore.js` with `add`, `delete`, `update`, and `useCollection`.
3.  **Setup Guardrails:**
    * [ ] Add `DataProvider` to `index.js`.
    * [ ] Update `package.json` with ESLint rules to ban direct Firestore imports.
4.  **Refactor Managers:**
    * [ ] Update `useRosterManager` to consume `useFirestore`.
    * [ ] Update `useChatManager` to consume `useFirestore`.
5.  **Validation:** Run the scenarios above to verify race conditions are gone.