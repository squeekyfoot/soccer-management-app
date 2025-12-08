## Feature Name: 
Event Management
## Feature Description: 
We need the formal implementation of events so that teams can properly coordinate attendance during certain events. These events would include team games and even social events so it's clear that this type of component would be highly reusable for many areas of the app. Players then would be able to mark their interest or attendence on such events, track them or share them appropriately.
## Expected User Roles: 
user, manager
## Scenarios List:
* Any role should be able to create an event with an event name, an event description, a start time and date and an optional end time and date.
* Before an event is created, the user should be able to select which type of event it is; For now, we should only support Social events and Game events
* If your role is user, then you can select only the "Social" event type; If your role is Manager, then you can select either "Social" or "Game" type of event.
* While creating this event, the author should be able to set up the response options; Response options should default based on what type of event they selected; They should have the ability to delete one of the options, change one of the options or add an option for that event.
* An event should ALWAYS have a designated "Yes" response and "No" response as 2 of the options; The author should have to indicate which options correlate with Yes and No.
* Response options should be a single-select radio button
* Regular users should be able to create a new event within the "Upcoming Events" view of their Home dashboard. 
* Users who create a Social event should be able to add invitees during creation using a common user-lookup modal; For now, the users available in this user lookup can be any user in the app
* Users who create the event should be able to toggle on or off whether invitees can invite other people; This should only be supported on the "Social" type events.
* Once a user creates the event, the event is stored in their "Upcoming Events" list in chronological order with the soonest event at the top of the list.
* Once this event is created, a notification is sent to each invitee's "Actions Needed" view as an "Invite" type to which the recipient can open and see the full details including the current set of respondees and those respondee's response selection.
* An event should pop up in an invitees "Upcoming Events" list even if they haven't yet responded; The upcoming events list should show everything that wasn't responded as a "No"-type option. Those events to which the invitee responded "No" to should be filtered out but accessed if they want to see it again.
* For "Social" events that have allowed invitees to invite other people, the invitee should be able to see the "Invite Others" option once they have provided their response.
* An invitee should be able to change their response all the way up until the start time of the event; Once the event starts, the ability to respond to the event should lock.
* A manager who creates a "Game" type of event should be able to select a full roster as an invitee group in addition to regular users
* Invitees of an event should be able to see the status of other invitees to the event and the date/time stamp to which they put their response
* Invitees should be able to change their response in the case that their availability changes
* For "Game" type of events, Managers should have the ability to lock responses at a certain date/time that they select; This helps with telling people that there's a deadline for response so the manager can properly coordinate replacements
* Invitees should have an ability to add an optional note to their response if there's some sort of context around their response; The comments should be hidden but accessible by an icon that an invitee or organizer can click on
## Design needs:
* Architecturally, this feature should be highly modular is it will be a very common component used in many different situations for the app. I have future plans to expand it for tournament usage or even swap the ability to create games just to facility staff members, etc. So please take care to use proper design practices and follow separation of concerns to the best of your ability.
* We need to think about creating a modular user-lookup modal of sorts. This is because user-lookups will become extremely common around the app and the visibility of which users are part of that lookup will be dependent on which context it's used in. For this context, we should be thinking about being able to look up not only individual users of the apps, but we should be able to lookup and select the members of particular entities such as "Groups" or "Rosters" that a user is part of.