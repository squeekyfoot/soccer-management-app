# **Architecture & Folder Structure Guide**

This document defines the architectural standards for the **Soccer Management App**. It is designed to strictly enforce the **"Brain vs. Body"** philosophy and provide clear boundaries for where code belongs.  
**For AI Collaborators:** Read the "AI Heuristics" in each section to understand where to generate new code.

## **1\. Core Philosophy: Brain vs. Body**

We separate **Business Logic (The Brain)** from **UI Rendering (The Body)**.

* **The Brain (src/hooks, src/context)**:  
  * Handles data fetching, state management, form validation, and side effects.  
  * *Never* contains JSX or UI styling.  
* **The Body (src/components)**:  
  * Receives data via props or hooks.  
  * Renders the UI.  
  * *Never* contains direct API calls or complex state logic.

## **2\. The Master Directory Map**

src/  
├── assets/              \# Static assets (images, logos, global fonts)  
│  
├── components/          \# THE BODY: All React UI code  
│   ├── ui/              \# "Dumb" Generic UI (Buttons, Inputs, Cards) \- formerly 'common'  
│   ├── domain/          \# Business Entities (RosterCard, UserSearch) \- Smart UI  
│   ├── layout/          \# App Shell (Sidebar, Navbar, Layout wrappers)  
│   └── views/           \# Pages/Screens (ManagerDashboard, Home)  
│  
├── config/              \# Configuration files (Firebase rules, 3rd party keys)  
├── context/             \# Global State (User Session, Theme, Unread Counts)  
├── hooks/               \# THE BRAIN: Reusable logic & behavior  
├── lib/                 \# Initialized library instances (firebase.js, axios)  
├── styles/              \# Global CSS  
└── utils/               \# Pure functions (math, formatting) \- No React

## **3\. Directory Guidelines**

### **src/components/ui/ (formerly common)**

**Definition:** Generic, presentational components. They are agnostic to the "Soccer" domain.

* **Examples:** Button.js, Card.js, Modal.js, Input.js  
* **Dependencies:** Can typically be copied to a completely different project (e.g., a To-Do app) and still work.  
* **AI Heuristic:**  
  * ❌ NEVER import firebase, useAuth, or domain hooks here.  
  * ✅ props should be simple primitives (text, onClick, variant).

### **src/components/domain/ (The "Smart" UI)**

**Definition:** Reusable UI components that represent a specific **Business Entity**. These are used across multiple Views.

* **Examples:**  
  * users/UserSearch.js (Used in Messaging & Manager Dashboard)  
  * rosters/RosterCard.js (Used in Home & My Teams)  
  * chat/ChatWindow.js  
* **Dependencies:** Can import hooks and context.  
* **AI Heuristic:**  
  * ✅ IF a component is used in \>1 View OR represents a database entity, put it here.  
  * ✅ Organize by entity folder (/users, /rosters, /leagues).

### **src/components/views/**

**Definition:** The specific pages/screens of the application. They act as "Orchestrators."

* **Examples:** Manager/ManagerDashboard.js, Home/Home.js  
* **Responsibility:**  
  1. Call the Hooks (Brain) to get data.  
  2. Pass that data into Domain/UI Components (Body).  
  3. Define the layout/grid of the page.  
* **AI Heuristic:**  
  * ❌ Do not define complex sub-components inside a View file. Move them to domain/.  
  * ✅ A View should mostly look like a list of \<Component /\> calls.

### **src/hooks/**

**Definition:** The application's "Brain." All reusable logic lives here.

* **Examples:** useRosterManager.js, useGroupManager.js, useProfileLogic.js  
* **Responsibility:** CRUD operations, API calls, subscriptions, complex state.  
* **AI Heuristic:**  
  * ✅ Start here when implementing a new feature functionality.  
  * ✅ Functions defined here must be stable (use useCallback).

### **src/context/**

**Definition:** Global state "Water" that flows through the whole app.

* **Examples:** AuthContext.js (User Identity), ChatContext.js (Global Unread Counts).  
* **Rule:** Only put data here if it is needed by *many* distant components (e.g., the Sidebar needs to know if you are logged in).  
* **AI Heuristic:**  
  * ❌ Avoid the "God Object" anti-pattern. Do not put specific feature logic (like "Create League") here. Use a Hook instead.

### **src/utils/**

**Definition:** Pure JavaScript functions.

* **Examples:** formatDate(), calculateWinPercentage().  
* **AI Heuristic:**  
  * ❌ No React code (useState, useEffect) allowed here.  
  * ✅ Inputs \-\> Outputs only.

## **4\. Decision Matrix: Where does code go?**

| Scenario | Destination Folder | Why? |
| :---- | :---- | :---- |
| **"I need a reusable Blue Button."** | src/components/ui/ | It's generic UI styling. |
| **"I need to display a Player's photo and name."** | src/components/domain/users/ | It's a specific business entity. |
| **"I need to calculate the days until a game."** | src/utils/ | It's pure math/date logic. |
| **"I need to fetch the list of Leagues from Firebase."** | src/hooks/useLeagueManager.js | It's business logic/data fetching. |
| **"I need a page to show the Manager their tools."** | src/components/views/Manager/ | It's a specific route/page. |
| **"I need to know if the user is logged in anywhere in the app."** | src/context/AuthContext.js | It's global state. |

## **5\. Refactoring Checklist (Migration Guide)**

When refactoring legacy code to this structure:

1. **Move** generic components from components/shared → components/domain/{entity}.  
2. **Extract** inline logic from views/\*.js → hooks/use{Feature}.js.  
3. **Ensure** components/ui components have zero dependencies on app logic.  
4. **Verify** that views are only importing from domain, ui, and hooks.