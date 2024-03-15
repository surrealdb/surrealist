<br>

<div align="center">
	<img src=".github/branding/banner.png">
</div>

<br>

<h1 align="center">
	SurrealDB Surrealist
</h1>

<p align="center">
  <a href="https://github.com/surrealdb/surrealist/blob/master/LICENSE">
    <img src="https://img.shields.io/github/license/surrealdb/surrealist"> 
  </a>
  <img src="https://img.shields.io/github/repo-size/surrealdb/surrealist">
  <img src="https://img.shields.io/github/contributors/surrealdb/surrealist">
</p>

Surrealist is the official query playground, data explorer, and schema designer for [SurrealDB](https://surrealdb.com/). Connect to any SurrealDB server and execute queries in a graphical interface, including intelligent auto completion, syntax highlighting, and much more. Switch to the explorer view to browse database tables, edit record contents, and traverse graph relationships. Use the designer view to create or modify your database schema, and manage logins and scopes with the authentication view.

## Features
- ⚡ SurrealQL syntax highlighting
- 🔍 Database explorer & record inspector
- ✏️ Full schema creation, modification, and visualization
- 🔒 Manage database logins & scopes
- 📌 Define multiple sessions & environments
- 📋 Automatic table name completion
- 💫 Support for multiple queries in one request
- 🔭 Start a local database directly from the application
- 📜 Query history & Query favoriting

## How to use
You can [read our documentation](https://surrealdb.com/docs/surrealist) for information on how to use Surrealist.

## Web App
You can use Surrealist by visiting https://surrealist.app/

While the web app provides a convenient and easy way to use Surrealist, the desktop app offers additional features such as an integrated database runner and offline support.

## Desktop App
You can download the latest version of Surrealist Desktop from our [Releases](https://github.com/surrealdb/surrealist/releases) page. This version provides significantly more functionality over the web app, so it is considered the recommended way to use Surrealist.

## Features

### Local database
You can start a local database directly from the application by pressing the start button in the top right. Doing so will start up a SurrealDB instance using the credentials and port entered for the current tab.

You can choose whether the local database is stored in memory or stored on disk on the Settings screen.

This functionality is currently only available in the desktop app.

### Query view
Use the Query View to execute queries against your database. You can define variables in the Variables panel and use them in your queries, and browse the results in the Results panel.

Executed queries are saved to the Query History or can be manually saved to the Favorites panel to quickly access previous queries.

![Query View](.github/branding/query-view.png)

### Explorer view
The Explorer View is used to browse your database and inspect individual records. When you select a table in the left panel, the table contents will be displayed in the Record Explorer. You can click on a record id to open the Record Inspector, in which you can edit the record contents and traverse graph relationships.

![Explorer View](.github/branding/explorer-view.png)

### Designer view
The Designer View is a powerful tool you can use to define and manage your database schemas. You can create tables & edges, modify the database schema, and visualize the database tables in a graph view.

![Designer View](.github/branding/designer-view.png)

### Authentication view
Use the Authentication View to manage access to the database by creating namespace logins, database logins, or scopes.

![Authentication View](.github/branding/authentication-view.png)

## Contributing
We welcome any issues and PRs submitted to Surrealist. Since we currently work on multiple other projects and our time is limited, we value any community help in supporting a rich future for Surrealist.

Before you open an issue or PR please read our [Contributor Guide](CONTRIBUTING.md).

## Disclaimer
- The latest release always attempts to be up-to-date with the latest SurrealDB beta. No attempt is made to keep Surrealist compatible with the latest nightly builds.
- Connections to remote servers may require a HTTPS connection. You can easily configure SSL for your server using tools like Letsencrypt and nginx.

## Development
This project is built using [Tauri](https://tauri.app) and [React](https://reactjs.org/).

### Requirements
- [Rust](https://www.rust-lang.org/tools/install)
- [Nodejs LTS](https://nodejs.org/en/)
- [PNPM](https://pnpm.io/) (npm i -g pnpm)

Additionally, on ubuntu you will need to install the following packages: \
`apt install libjavascriptcoregtk-4.0-dev libsoup2.4-dev libwebkit2gtk-4.0-dev`

### Live Development

To run in live development mode, run `npm run tauri:dev` in the project directory. This will run a Vite development
server that will provide very fast hot reload of your frontend changes.

### Building

To build a redistributable, production mode package, use `npm run tauri:build`.

## License

Surrealist is licensed under [MIT](LICENSE)

Copyright © 2024 SurrealDB Ltd
