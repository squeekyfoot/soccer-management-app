# Repository Guide for Agents

## Build & Test
- **Test:** `npm test` (Runs all) | `npm test -- <filename>` (Single file)
- **Build:** `npm run build`
- **Lint:** No explicit script; follow existing patterns.

## Code Style & Conventions
- **Framework:** React 19 (JS), Firebase (Firestore/Storage), React Router 7.
- **Components:** Functional components, PascalCase, `export default`. Destructure props.
- **Logic:** Encapsulate business logic/Firebase in custom hooks (e.g., `useUserManager`).
- **State:** Use Context for global auth/theme, `useState`/`useReducer` for local.
- **Styling:** CSS Modules (`*.module.css`) for components, `App.css` global. Avoid inline.
- **Naming:** variables/hooks `camelCase`, components `PascalCase`.
- **Imports:** React -> 3rd Party -> Local Components -> Context/Hooks -> Styles.
- **Error Handling:** `try/catch` in async ops; expose `error` state in hooks.
- **Testing:** Jest/RTL. Create `*.test.js` alongside source or in `__tests__`.

## Rules
- Always verify changes with `npm test`.
- Reuse existing "Manager" hooks for data operations.
