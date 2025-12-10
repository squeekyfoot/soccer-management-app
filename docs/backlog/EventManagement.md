## Feature Name: 
Event Management
## Feature Description: 
We need the formal implementation of events so that teams can properly coordinate attendance during certain events. These events would include team games and even social events so it's clear that this type of component would be highly reusable for many areas of the app. Players then would be able to mark their interest or attendence on such events, track them or share them appropriately.
## Expected User Roles: 
user, manager
## Scenarios List:
1. Any role should be able to create an event with an event name, an event description, a start time and date and an optional end time and date.
2. Before an event is created, the user should be able to select which type of event it is; For now, we should only support Social events and Game events
3. If your role is user, then you can select only the "Social" event type; If your role is Manager, then you can select either "Social" or "Game" type of event.
4. While creating this event, the author should be able to set up the response options; Response options should default based on what type of event they selected; They should have the ability to delete one of the options, change one of the options or add an option for that event.
5. An event should ALWAYS have a designated "Yes" response and "No" response as 2 of the options; The author should have to indicate which options correlate with Yes and No.
6. Response options should be a single-select radio button
7. Regular users should be able to create a new event within the "Upcoming Events" view of their Home dashboard. 
8. Users who create a Social event should be able to add invitees during creation using a common user-lookup modal; For now, the users available in this user lookup can be any user in the app
9. Users who create the event should be able to toggle on or off whether invitees can invite other people; This should only be supported on the "Social" type events.
10. Once a user creates the event, the event is stored in their "Upcoming Events" list in chronological order with the soonest event at the top of the list.
11. Once this event is created, a notification is sent to each invitee's "Actions Needed" view as an "Invite" type to which the recipient can open and see the full details including the current set of respondees and those respondee's response selection.
12. An event should pop up in an invitees "Upcoming Events" list even if they haven't yet responded; The upcoming events list should show everything that wasn't responded as a "No"-type option. Those events to which the invitee responded "No" to should be filtered out but accessed if they want to see it again.
13. For "Social" events that have allowed invitees to invite other people, the invitee should be able to see the "Invite Others" option once they have provided their response.
14. An invitee should be able to change their response all the way up until the start time of the event; Once the event starts, the ability to respond to the event should lock.
15. A manager who creates a "Game" type of event should be able to select a full roster as an invitee group in addition to regular users
16. Invitees of an event should be able to see the status of other invitees to the event and the date/time stamp to which they put their response
17. Invitees should be able to change their response in the case that their availability changes
18. For "Game" type of events, Managers should have the ability to lock responses at a certain date/time that they select; This helps with telling people that there's a deadline for response so the manager can properly coordinate replacements
19. Invitees should have an ability to add an optional note to their response if there's some sort of context around their response; The comments should be hidden but accessible by an icon that an invitee or organizer can click on

## Design needs:
20. Architecturally, this feature should be highly modular is it will be a very common component used in many different situations for the app. I have future plans to expand it for tournament usage or even swap the ability to create games just to facility staff members, etc. So please take care to use proper design practices and follow separation of concerns to the best of your ability.
21. We need to think about creating a modular user-lookup modal of sorts. This is because user-lookups will become extremely common around the app and the visibility of which users are part of that lookup will be dependent on which context it's used in. For this context, we should be thinking about being able to look up not only individual users of the apps, but we should be able to lookup and select the members of particular entities such as "Groups" or "Rosters" that a user is part of.

## Additional Clarifications
The following scenarios and edge cases were identified through peer review and should be explicitly clarified:

22. A user with any role who creates a social event should only be able to see a roster entity in the user search when they themselves are apart of that roster.
23. On the backend, we need to create a new top-level collection named "events"; We should create sub-collections for any event type moving forward (such as "Social" or "Game", etc.). This is because each of these event types should have a number of type-specific attributes
24. On the backend, the "Game" type event attributes should also include the roster ID that is associated with it
25. If an event organizer changes the Time or Location after people have already responded, then the event should have an message in the event details that says the "orginal time has changed", then all invitees response status changes to pending, then all invitees should get an "Action Needed" action item that presents the options all over again.
26. The "Yes" and "No" options are specifically for system filtering capability; When an organizer creates an event and sets the options, there should be at least 2 default options (that they can change); One should have a yes badge or relevant icon next to it to show that this option represents a "Yes" and the other should have a no badge or relevant icon next to it to show that this option represents a "No". The organizer should be able to add additional custom options to help organize potential situations, but these custom options won't need to have this system tagging applied.
27. As an event organizer, if I select a roster as an invitee group for any type of event (Social or Game, etc.) then the event should be linked to the Roster, so that if a new player joins the roster later before the event occurs, then the new player gets an invite automatically. Likewise, if a community group is selected as an invite, the event should be linked to the community group and any new community group member should be invited. 
28. Some groups are representative of rosters so if a community group and a roster is selected as invitees, then invitees should never get duplicate invites to the same event.
29. Setting a date and time for an event should be set to an absolute time zone; People that organize and respond to events can frequently travel, so having changing times as invitees cross timezones may be confusing to keep track of; The organizer should have to specify the timezone explicitly.
30. We need to create a new "actionItems" collection as these are things that need to be performed; The immediate documents in the newly created "actionItems" collection should represent an action item to be sent to the "Actions Needed" sub-view and should contain common attributes such as createdAt, type, status, userId, etc. We should also add a new common attribute of "dismissable" of type boolean which would indicate if the user is allowed to clear it from the "Actions Needed" sub-view list.
31. The current "rosterRequests" collection can remain in firestore as is but each new roster request sent to a user should be linked to a parent "actionItem" (this way the actionItems doc explains how it can behave and the rosterRequests doc explains the details/outcome of the request type)
32. Clarification on my earlier statement of "Notification is sent to each invitee's 'Actions Needed' view": I should have used the word action item not notification, as notification is another type of item appearing in another view (notifications); We don't need anything sent to notifications regarding events.
33. When a user gets a new event invite, they should get an action item in their "Actions Needed" list and the action item should be dismissable "yes". If the user chooses to dimiss it without responding to the event, they simply appear as "pending" on the event on the visible list of invitees.
34. UI Reusability: I need the Event Details Modal to be identical and reusable regardless of the type of event. The type of event will only dictate which fields, sections or attributes appear within the modal.
35. Delete Permissions: Only the creator (author) can delete a social event. Only a manager can delete a game event.
36. Notifications: We can use notification toasts for success/failure messages right now, but we don't need to create a new useEventLogic hook specifically to handle unanswered events. This is because the event invites should be dismissable and the user should still see the event in the "Upcoming Events" sub-view list. If they want to answer at a later time, they can just navigate to that list and answer.
37. Data Structure: We need to create a new top-level events collection for both social and game-type events; Social events can be a sub-collection and game events can be another sub-collection.
38. Updates: Changing the event time or date should reset the RSVPs and the invitees should get a new action item all over again. They should be represented as "pending" once again.
39. Group Invites: When inviting a Group or Roster, this should be a persistent link not a one-time snapshot of users.