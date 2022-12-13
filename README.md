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

Surrealist is a simple Desktop based query playground for [SurrealDB](https://surrealdb.com/). Easily and quickly connect to any SurrealDB database in order to execute and preview query responses.

While Surrealist is still in active development it is suitable for general use.

## Features
- Multi-tab query editing
- Support for multiple queries in one request
- Provides a clean and foldable view of your query result
- SurrealQL syntax highlighting

## Download
You can download the latest version of Surrealist from our [Releases](https://github.com/StarlaneStudios/Surrealist/releases) page.

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
