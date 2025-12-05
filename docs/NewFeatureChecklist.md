# Phase 0: AI Tool Preparation

**Goal:** Set up the AI tool to undersand a context and preferences that you may need to repeat constantly.

**Checklist**:
1. Grab repository URL if it's changed from this one
2. Ensure prompt has descriptor of your project
3. Identify any relevant files in case it needs some additional context (such as architecture files)
4. Include general instructions on how it's to help
5. Tell the the scope (and what's out of scope)
6. Give any preferences to remember (full code, brain vs. body)

**Repository URL**:
https://github.com/squeekyfoot/soccer-management-app

**Prompt:**

I'm developing a sports management application and I've included my repository for your context. The primary README at the root of the project has general overview information about everything. I maintain a general philosophy of "Inside-Out" (Data & Logic → UI Components → View Orchestration).

Instruction: I need your help with development of this project.
Scope: We are only working on the web app today and not worrying about any code in the mobile app, as I will port that over in the upcoming days.
Requirements: Please follow these requirements as we proceed working together:
* I'm not a developer so I barely know coding language and nuances-you must give me full code files when writing code so I can copy and paste the full document without wasting time
* Do not truncate code, because I will make you re-render the complete code which will defeat your original purpose of trying to be efficient
* Please be on the lookout for scalability and resiliency-meaning if I ask you to create a new piece of functionality, try to break apart the data/logic/ui concerns and file it into the appropriate folder structure
* Do not just agree with every thought I have, I am flawed and I want to know when I'm not utilizing best practices or going against intended project design

Please verify that you understand the project, these instructions and my requirements today.


-------------------------------------------


### Phase 1: The Foundation (Docs, Data & Logic)
**Goal:** Define the feature once, then immediately generate the "Contract" (Docs) and the "Engine" (Hook & Tests) to fulfill it.

**The Workflow:**
1.  **Define:** Fill out the "Feature Context" (mental or scratchpad).
2.  **Document:** Update `SCENARIOS.md` to lock in the requirements.
3.  **Implement:** Create the Hook (`use...Manager`) that powers those requirements.
4.  **Verify:** Create the Unit Test to prove it works.

**Checklist:**
- [ ] **Define the Feature Context** (Name, Fields, Actions).
- [ ] **Update `docs/SCENARIOS.md`** (The Contract).
- [ ] **Create the Hook** (`src/hooks/use{Entity}Manager.js`).
- [ ] **Create the Test** (`src/hooks/__tests__/use{Entity}Manager.test.js`).
- [ ] Run `npm test` to confirm the foundation is solid.

#### Step 1: Define the Feature Context (Do this once)
*To avoid repeating yourself, fill in these blanks mentally or in a notepad. You will paste this "Context" into the prompts below.*

**Feature Context:**
* **Feature Name:** (e.g., `Tournaments`)
* **User Role:** (e.g., Manager)
* **Database Fields:** (e.g., `name`, `startDate`, `bracketType`)
* **Required Actions:** (e.g., `create`, `delete`, `generateBracket`)

#### Step 2: The Prompts (Execute the Plan)

**Prompt A: The Contract (Documentation)**
I am building a new feature. Here is the **Feature Context**: [PASTE CONTEXT HERE].

Please generate the specific Markdown table row to update `docs/SCENARIOS.md`.
* **Columns:** Feature Area | Scenario (Action) | Expected Outcome | Critical Path?
* **Focus:** Define the successful user outcome for this feature (e.g., 'Manager creates tournament -> Tournament appears in list').

**Prompt B: The Brain (The Hook)**

Using the same Feature Context, please create the custom hook `src/hooks/use[ENTITY]Manager.js`.
Requirements:
1.  Interact with the'[COLLECTION_NAME]' Firestore collection.
2.  Export `loading`, `error`, and the actions defined in my Context.
3.  Strict Rule: NO JSX. Return only data and functions.

**Prompt C: The Safety Net (The Test)**

Now generate the unit test file `src/hooks/__tests__/use[ENTITY]Manager.test.js` for the hook we just created.
Requirements:
1.  Mock `firebase/firestore` (addDoc, getDocs, etc.) so no network calls occur.
2.  Test the 'Happy Path' (Success) and one 'Error Case' (Failure).
3.  Mock `useAuth` to simulate a logged-in user.


-------------------------------------------


### Phase 2: The Body (Domain Components)
**Goal:** Build the reusable UI blocks (Cards, Forms) that consume the Hook.
**Files:** `src/components/domain/{entity}/*`

- [ ] Create **Card** component.
- [ ] Create **Form/Modal** component.

**Prompt:**
> "Now I need the Domain Components for **[FEATURE NAME]**. Please create the following files in `src/components/domain/[ENTITY]/`:
>
> 1.  **`[ENTITY]Card.js`**: Displays a summary of the item. Accepts `item` and `onAction` props.
> 2.  **`Create[ENTITY]Form.js`**: A form to add a new item using my generic UI components (`src/components/ui/Input`, `Button`).
>
> **Strict Rules:**
> * Do NOT import firebase or hooks here. These are 'dumb' components.
> * Use `lucide-react` for icons and `src/lib/constants` for colors."


-------------------------------------------


### Phase 3: The Orchestrator (The View)
**Goal:** Connect the Brain (Phase 1) to the Body (Phase 2).
**Files:** `src/components/views/{Feature}/{Feature}.js`

- [ ] Create the View file.
- [ ] Connect Hook to Components.

**Prompt:**
> "Please create the View component `src/components/views/[FEATURE]/[FEATURE].js`.
>
> **Responsibilities:**
> 1.  Import `use[ENTITY]Manager` (from Phase 1).
> 2.  Import the Domain Components (from Phase 2).
> 3.  Fetch data using the hook and render the list using the Card component.
> 4.  Handle the 'Create' action by opening the Form component (manage modal state locally)."


-------------------------------------------


### Phase 4: The Map (Routing)
**Goal:** Make it accessible.
**Files:** `src/App.js`

- [ ] Add Route to `src/App.js`.

**Prompt:**
> "Please provide the code snippet to add **[VIEW_NAME]** to my `src/App.js`. It should be a protected route at **'/[PATH_NAME]'**."