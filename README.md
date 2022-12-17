<br>

<div align="center">
	<a href="https://github.com/StarlaneStudios/Surrealist#gh-light-mode-only">
		<img src=".github/branding/logo-dark.png" height="80">
	</a>
	<a href="https://github.com/StarlaneStudios/Surrealist#gh-dark-mode-only">
		<img src=".github/branding/logo-light.png" height="80">
	</a>
</div>

<div align="center">
	<img src=".github/branding/promo.png">
</div>

## About

Surrealist is a simple to use Desktop based query playground for [SurrealDB](https://surrealdb.com/). You can connect to any SurrealDB server and execute queries in a graphical interface, including table & variable auto completion, syntax highlighting, and much more.

## Features
- 📌 Multi-tab query editing
- ⚡ SurrealQL syntax highlighting
- 📋 Automatic table name completion
- 💫 Support for multiple queries in one request
- ✏️ Define variables in a seperate panel
- 🔍 A clean and foldable view of your query results
- 🔭 Start a local database directly from the application
- 📜 Query history drawer

## Local database
You can start a local database directly from the application by pressing the start button in the top right. Doing so will start up a SurrealDB instance using the credentials and port entered for the current tab.

You can choose whether the local database is stored in memory or stored on disk on the Settings screen.

## Download
You can download the latest version of Surrealist from our [Releases](https://github.com/StarlaneStudios/Surrealist/releases) page.

### Running on MacOS
When running Surrealist on MacOS, as the application is not signed, you may be prompted that the file is damaged and can't be opened. If this happens, you can follow the following steps to bypass this.

- Move the downloaded `surrealist-xxx-darwin-arm64.tgz` outside your Downloads folder (to add the application to Launchpad, move it to the "/Applications" folder)
- Extract the application from the tgz file
- Delete the tgz file, as it is no-longer needed
- Open the Terminal app and navigate to the folder you extracted Surrealist into
- Run the command `sudo xattr -rd com.apple.quarantine Surrealist.app` (You may be prompted to enter your password)

If these steps don't work, please open an issue ticket.

## Development
This project is built using [Wails v2](https://wails.io/) and [React](https://reactjs.org/).

### Requirements
- [Go](https://go.dev/)
- [Wails CLI](https://wails.io/docs/gettingstarted/installation)
- [Nodejs LTS](https://nodejs.org/en/)
- [PNPM](https://pnpm.io/) (npm i -g pnpm)

### Live Development

To run in live development mode, run `wails dev` in the project directory. This will run a Vite development
server that will provide very fast hot reload of your frontend changes. If you want to develop in a browser
and have access to your Go methods, there is also a dev server that runs on http://localhost:34115. Connect
to this in your browser, and you can call your Go code from devtools.

### Building

To build a redistributable, production mode package, use `wails build`.
