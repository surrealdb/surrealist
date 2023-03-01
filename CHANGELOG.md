# Change Log

## 1.6.0 - Designer & Authentication
- Added designer view
	- Allows graphically creating and modifying schemas
	- Supports permissions, fields, indexes, and events
	- Creating new tables and edge tables
- Added authentication view
	- Manage namespace & database logins
	- Manage database scopes
- Rewritten backend in Rust
	- Will allow for more intelligent features in the future
	- Dev tools are now available in release builds (Ctrl + Shift + I)
- Added the ability to filter table lists
- Allow executing queries from variables pane
- Highlighting for single quotes and &lt;future&gt;
- Added "Execute selection" option to query editor context menu
- Improved matching of certain types in explorer view
- The current view is now scoped to the tab instead of global
- Edge tables now display a different icon from normal tables
- Fixed crash on connecting to insecure endpoint

## 1.5.2 - Bug fixes
- Add new anonymous connection authentication mode
- Improve record link detection
- Fixed database and scope authentication not working
- Add more syntax highlighting keywords
- Fixed certain functions not being matched correctly
- Fixed crash when editing a saved query
- Fixed horizontal scrollbar in history and favorites panel

## 1.5.1 - New shortcuts
- Added new keyboard shortcuts
	- `Ctrl + number` to switch to another tab
	- `Ctrl + Q` to switch to the Query View
	- `Ctrl + E` to switch to the Explorer View
	- `Ctrl + S` to start / stop the local server
	- `Ctrl + -` to zoom out
	- `Ctrl + +` to zoom in
- Added editor zooming
	- Experimental, may not work on all systems (This cannot be fixed at the moment)
	- Can cause issues with draggable elements
- Added the ability to create new records in explorer view
- Added the ability to delete records in explorer view
- Add button to disconnect from the database when connected
- Improve automatic theme and prevent potential flashing of the wrong theme
- Fixed history not saving when all entries are cleared
- Added syntax highlighting for SurrealDB functions
- Improve WebSocket handling to result in more consistent behavior
- Fixed table view incorrectly marking certain strings as records
- Tweak some default values
- Various UI/UX improvements

## 1.5.0 - Explorer view
- Added an explorer view to view and edit tables and their data
	- You can switch between Query and Explorer view using the button in the top left
	- Edit records directly as JSON
	- View and traverse record relations
	- Columns can be sorted by clicking on the header
- Redesigned the table view
	- Improved cell rendering based on data type
	- Objects and arrays can be hovered for a preview
	- Null and undefined values are now styled differently
- Added namespace, database, and scope authentication
	- Redesigned the connection details dialog to include new fields
- Added additional keywords for highlighting
- Table completion will now be triggered in more situations
- Tabs can be dragged to reorder them
- Improved favorites dragging behavior

## 1.4.2 - Improved favorites
- Redesigned the favorites UI/UX
	- Queries are now be opened by clicking rather than hovering
	- You can now edit and rename queries in a dialog
	- Favorites can be manually sorted by dragging
	- Added the option to open a query in a new tab
- New tabs now use the connection details of the previous tab
- Hide the Surreal banner in the console
- Improved the pane dragging behavior
- Fixed text moving within the editor when selected

## 1.4.1 - Saved queries (Fixed)
- Highlight regex correctly in the query editor
- Fixed updater not working
- Fixed issues with the table viewer
- Improve database start/stop button behavior
- Changed default tab names

## 1.4.0 - Saved queries
- Added query saving functionality
- Added a button to render query results as table
- Redesigned the query history UI
- Added F9 as shortcut for "Execute query"
- F9 and Ctrl + Space now work outside the editor
- Improved the panel resizing behavior

## 1.3.0 - Console panel
- Added a console panel to view logs for the integrated database (#1)
	- Can be hidden and revealed on the fly or from the setting screen
- Disabled uneccecary auto completion for input fields (#3)
- Added configurable global query timeout setting
- Added update checker to prompt about new releases
	- Can be disabled from the settings screen
- Added comment toggle shortcut to the query editor (Ctrl + /)
- Updated the setting screen UI

## 1.2.0 - Local database
- Added the ability to start and stop a local database directly from Surrealist
	- Will use the username, password, and port entered for the current tab
	- The tab hosting the database will display an indication icon
- Added an "Automatic" theme option that uses your operating system theme
	- This is now the default
- Added auto completion support for variables

## 1.1.2 - Query history
- Query history drawer
- Result wrapping setting
- Ctrl+Space to suggest table names at any time
- Various UI fixes

## 1.1.1 - UX Improvements
- Fixed indentation issues
- Improved query result consistency
- Added auto completion for table names

## 1.1.0 - Feature complete
- Auto connect when switching tabs
- Dark theme support
- Variables pane
- Improved error handling
- Various UI fixes

## 1.0.0 - Initial release
- Multi-tab query editing
- Support for multiple queries in one request
- Provides a clean and foldable view of your query result
- SurrealQL syntax highlighting