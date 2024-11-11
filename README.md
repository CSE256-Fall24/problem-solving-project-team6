# gender-mag

Push to repo...

11/2 - Jonas Schwab:
- I made it so that the undo and redo buttons also update the change log when pressed.
- Centered the buttons on Permissions page
- Edited strength of important components
- Fixed distance of pop up window distance to the banner at the top

11/10 - Jonas Schwab:
- Changed 'Advanced' button to 'Advanced Permissions' to improve scent.
- Failed to change hover states or undo button functionality

Jalen Patel - Changes (sorry for the poor formatting, it's in bullets on preview)
	⁃	brainstormed initial implementation of logging/displaying changes and adding undo/redo features - using stacks, getElementById, addEventListener, etc.
	⁃	created stacks for userActions, undoStack, and redoStack in tracker.js
	⁃	added getElementById to call logAction whenever a permission checkbox state is changed by adding eventListeners on objects in the ".perm_checkbox" class (initial log solution) 
	⁃	created logAction function to log each change made, push to the userActions and undoStack stacks, empty the redoStack, and popup an alert to the user
	⁃	called logAction when change made (final log solution)
	⁃	displayed change log (userActions stack) on screen cohesively
	⁃	made undo and redo buttons 
	⁃	created undo and redo stack functions on backend to get (pop) the relevant change from either the undoStack and redoStack and add (push) it to the other one
	⁃	added undo and redo buttons to the perm dialog
	⁃	made and appended a change log div to the perm dialog
	⁃	created an updateChangeLog function, added $('#change_log_list') so list can change dynamically and used in other files, emptyed the current list, added each userAction to the list as a bullet point, called it when a new action is logged
	⁃	i was trying to figure out why the change log div isn't showing and integrate the undo/redo button click with the permission checkbox states
	⁃	got the Change Log feature working
	⁃	refactored change log so it could work across different users and files too when working on the same task
	⁃	reorganized/reformatted each Change Log change into bullets/subbullets
	⁃	got rid of popup alerts for individual changes
	⁃	displayed a "no changes" message if no changes have been made yet (meaning userActions is empty)
	⁃	used props and attributes to store change data
	⁃	capitalized certain change data for display purposes
	⁃	made a HTML/CSS styled logMessage for permission changes (using above data) and passed it into logAction
	⁃	added CSS styling to change log display so bullets are not hugging the left side of dialog and so there's no whitespace between actual bullet points and the text for the bullet
	⁃	tried adding padding between different changes in change log display (using padding-bottom and line-height methods), but didn't work
	⁃	implemented logging of another change besides a permission change - which is "remove user"
	⁃	made a HTML/CSS styled logMessage for "remove user" and passed it into logAction
	⁃	some other stuff / functions
	⁃	(some changes took many iterations to figure out before i pushed. just adding, changing, and moving code around to fix bugs. also, i initially coded certain things then upgraded them by deleting my original code and writing completely different code before i pushed (for example, initial display/format of changes in change log versus final display/format))
