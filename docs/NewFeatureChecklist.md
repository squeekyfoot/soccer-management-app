Phase 0: Definition & Documentation

Goal: Define the "Contract" (Data shape & Success criteria) before writing code.

Checklist:

[ ] Define the Entity Name (e.g., Tournament).

[ ] List the database fields needed (e.g., name, date, location).

[ ] List the user actions needed (e.g., create, join, delete).

[ ] Update docs/SCENARIOS.md to define the success criteria.

📋 Gemini Prompt for Phase 0 (Documentation): "I am adding a new feature: [FEATURE NAME].

Please generate the specific Markdown to update docs/SCENARIOS.md.

Identify the Role: Is this for a Standard User or a Team Manager?

Create the Matrix Row: Generate a table row in the format: | Feature Area | Scenario (Action) | Expected Outcome | Critical Path? |.

Details:

Action: [DESCRIBE USER ACTION, e.g., 'User clicks Filter button']

Outcome: [DESCRIBE RESULT, e.g., 'List updates to show only matching teams']

Critical: [YES/NO]

Please output only the Markdown table row so I can paste it directly into the file."

Phase 1: The Brain (Logic & Testing)

Goal: Build and verify the engine before building the car. Files: src/hooks/use{Entity}Manager.js and src/hooks/__tests__/use{Entity}Manager.test.js.

Checklist:

[ ] Create the Hook file with Firestore CRUD logic.

[ ] Create the Unit Test file.

[ ] Run npm test to verify the logic works in isolation.

📋 Gemini Prompt for Phase 1a (The Hook): "I am adding a new feature called [FEATURE NAME] to my React app. Please create the custom hook src/hooks/use[FEATURE]Manager.js following my 'Brain vs. Body' architecture.

Requirements:

It should use firebase/firestore to interact with the '[COLLECTION_NAME]' collection.

It must export loading, error, and the following actions: [LIST ACTIONS: e.g., createItem, fetchItems, deleteItem].

The fetch function should be memoized with useCallback.

Strict Rule: This file must contain ONLY logic and state. NO JSX or UI rendering."

📋 Gemini Prompt for Phase 1b (The Test): "I have created the hook src/hooks/use[FEATURE]Manager.js. Now I need to ensure it is robust.

Please generate the unit test file: src/hooks/__tests__/use[FEATURE]Manager.test.js.

Requirements:

Use @testing-library/react (renderHook, act) and jest.

Mock Firebase: Strictly mock firebase/firestore functions (collection, addDoc, getDocs) so no real network calls are made.

Test Cases:

Success: Verify that calling the action (e.g., createItem) calls the Firestore function with the correct parameters.

Failure: Mock a Firestore error and verify the hook returns false or sets an error state.

Mock useAuth context to provide a fake loggedInUser."

Phase 2: The Body (Domain Components)

Goal: Build the reusable UI blocks (Cards, Forms, Lists). Files: src/components/domain/{entity}/*

Checklist:

[ ] Create the Card component (Display item in a list).

[ ] Create the Form/Modal component (Create or Edit item).

[ ] Validation: Ensure these accept data via props only. No direct API calls here.

📋 Gemini Prompt for Phase 2 (Domain UI): "Now I need the Domain Components for [FEATURE NAME]. Please create the following files in src/components/domain/[FEATURE]/:

[FEATURE]Card.js: Displays a summary of the item. It should accept props: item (object) and onAction (function).

Create[FEATURE]Form.js: A form to add a new item. It should use my generic UI components (src/components/ui/Input, Button, etc.).

Strict Rules:

Do NOT import firebase or hooks here. These are 'dumb' presentation components.

Use src/lib/constants for colors if needed.

Use the lucide-react library for icons."

Phase 3: The Orchestrator (The View)

Goal: Connect the Brain (Phase 1) to the Body (Phase 2). Files: src/components/views/{Feature}/{Feature}.js

Checklist:

[ ] Create the View file.

[ ] Import the Hook from Phase 1.

[ ] Import the Domain Components from Phase 2.

[ ] Wire up the data and actions (glue code).

📋 Gemini Prompt for Phase 3 (The View): "Please create the View component src/components/views/[VIEW_NAME]/[VIEW_NAME].js.

Responsibilities:

Import and use use[FEATURE]Manager to fetch data and handle actions.

Import [FEATURE]Card and Create[FEATURE]Form from the domain folder.

Render a list of items using the Card component.

Render a 'Create' button that opens the Form component (manage the modal visibility state locally in this view).

Strict Rule: Keep this file clean. It should mostly look like a list of component calls. Do not write inline complex logic."

Phase 4: The Map (Routing)

Goal: Make the feature accessible via URL. Files: src/App.js

Checklist:

[ ] Import the new View in App.js.

[ ] Register the <Route> (Protected or Public).

[ ] Verify the User Flow matches the Scenario defined in Phase 0.

📋 Gemini Prompt for Phase 4 (Routing): "I need to expose this new view. Please provide the code snippet to add [VIEW_NAME] to my src/App.js routing configuration. It should be a protected route accessible only to logged-in users at the path '/[PATH_NAME]'."