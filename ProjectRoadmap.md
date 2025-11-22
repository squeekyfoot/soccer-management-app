Project Roadmap

✅ Phase 1-5: Foundation, Roles, Rosters, Schedule, Messaging (Completed)

[x] Security, Architecture, RBAC, Roster Management, Calendar, Team Chat.

👥 Phase 6: Groups & Community (CURRENT PRIORITY)

Goal: Create spaces for sub-communities (e.g., "Monday Night Crew") that span teams.

[ ] Data Model:

Create groups collection.

Fields: name, description, about, links (array of objects), members (array of UIDs).

Sub-collections: posts (for feed), events (group-specific).

[ ] Security Rules:

Allow read if user is in members.

Allow write (posts/events) if user is in members.

[ ] Group Logic (Context):

createGroup, fetchUserGroups, joinGroup.

createPost, fetchPosts.

[ ] Group UI:

Group List: Main navigation view.

Group Detail: Tabs for "About", "Posts", "Events", "Members".

🚀 Phase 7: Mobile Parity & Distribution

[ ] Mobile App Refactor: Port all web features to React Native.

[ ] Distribution: TestFlight.