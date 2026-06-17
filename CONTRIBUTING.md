# Contributing

We would &nbsp;<img width="15" alt="Love" src="https://github.com/surrealdb/surrealdb/blob/main/img/love.svg?raw=true">&nbsp; for you to contribute to Surrealist and help make it better! We want to ensure contributing to Surrealist is fun, enjoyable, and educational for anyone and everyone. All contributions are welcome, including features, bug fixes, and documentation changes, as well as updates and tweaks, blog posts, workshops, and everything else.

## How to start

If you are worried or don’t know where to start, check out our next section explaining what kind of help we could use and where can you get involved. You can ask us a question in the [SurrealDB Discord Server](https://surrealdb.com/discord).

## Code of conduct

Please help us keep this project open and inclusive. Kindly read and follow our [Code of Conduct](/CODE_OF_CONDUCT.md).

## Building and running locally

Surrealist is a Vite + React web app with an optional Tauri desktop shell. All commands below are run from the repository root unless noted otherwise.

### Prerequisites

- [Bun](https://bun.sh/) (see `.github/workflows/check.yml` for the version used in CI)
- [Rust](https://www.rust-lang.org/tools/install) (stable toolchain, for the desktop app)
- Platform libraries for Tauri:
  - **Linux:** `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`, `patchelf`
  - **macOS:** Xcode command line tools
  - **Windows:** Microsoft C++ Build Tools and the WebView2 runtime

Install frontend dependencies once:

```bash
bun install
```

### Web app

Run the web app in development mode (hot reload at http://localhost:1420):

```bash
bun run dev
```

Build the static web assets into `dist/`:

```bash
bun run build
```

Preview a production build locally:

```bash
bun run preview
```

### Desktop app (development)

Run Surrealist inside the Tauri shell with hot reload:

```bash
bun run tauri:dev
```

### Desktop app (release build)

Build installers and bundles for your current platform (`.dmg`, `.app`, `.deb`, `.rpm`, `.AppImage`, `.msi`, and so on):

```bash
bun run tauri:build
```

Output is written under `src-tauri/target/release/bundle/`.

To compile the desktop binary without creating installers, pass `--no-bundle`:

```bash
bun run tauri build -- --no-bundle
```

The compiled executable is then available at:

| Platform | Path |
| --- | --- |
| Linux / macOS | `src-tauri/target/release/surrealist` |
| Windows | `src-tauri/target/release/surrealist.exe` |

Run it from the command line, for example:

```bash
./src-tauri/target/release/surrealist
```

On macOS you can also open the generated `.app` bundle from `src-tauri/target/release/bundle/macos/`.

Cross-compiling (for example `aarch64-apple-darwin` from an Intel Mac) is supported via Tauri’s `--target` flag. See `bun run tauri build -- --help` for options.

### Code quality

Before opening a pull request, run:

```bash
bun run qa   # format and lint (applies fixes)
bun run qc   # verify formatting and lint
bun run qts  # TypeScript type check
```

## Introducing new features

We would &nbsp;<img width="15" alt="Love" src="https://github.com/surrealdb/surrealdb/blob/main/img/love.svg?raw=true">&nbsp; for you to contribute to Surrealist, but we would also like to make sure Surrealist is as great as possible and loyal to SurrealDB's vision and mission statement. For us to find the right balance, please chat with us on Discord about any ideas before creating a [**GitHub Issue**](/issues). This will allow the community and team to have sufficient discussion about the new feature value and how it fits in the product roadmap and vision, before introducing a new pull request

## Submitting a pull request

The **branch name** is your first opportunity to give your task context.
Branch naming convention is as follows 

`type/brief-title`

Where `TYPE` can be one of the following:

- **refactor** - code change that neither fixes a bug nor adds a feature
- **feat** - code changes that add a new feature
- **fix** - code changes that fix a bug

### Commit your changes

- Write a descriptive **summary**: The first line of your commit message should be a concise summary of the changes you are making. It should be no more than 50 characters and should describe the change in a way that is easy to understand.

- Provide more **details** in the body: The body of the commit message should provide more details about the changes you are making. Explain the problem you are solving, the changes you are making, and the reasoning behind those changes.

- Use the **commit history** in your favour: Small and self-contained commits allow the reviewer to see exactly how you solved the problem. By reading the commit history of the PR, the reviewer can already understand what they'll be reviewing, even before seeing a single line of code.

### Create a pull request

- The **title** of your pull request should be clear and descriptive. It should summarize the changes you are making in a concise manner.

- Provide a detailed **description** of the changes you are making. Explain the reasoning behind the changes, the problem it solves, and the impact it may have on the codebase. Keep in mind that a reviewer was not working on your task, so you should explain why you wrote the code the way you did.

- Describe the scene and provide everything that will help to understand the background and a context for the reviewers by adding related GitHub issues to the description, and links to the related PRs, projects or third-party documentation. If there are any potential drawbacks or trade-offs to your changes, be sure to mention them too.

- Be sure to **request reviews** from the appropriate people. This might include the project maintainers, other contributors, or anyone else who is familiar with the codebase and can provide valuable feedback. You can also join our Developer Office Hours on Discord to chat with the maintainers who will review your code! 

### Getting a better review

- [**Draft pull requests**](https://github.blog/2019-02-14-introducing-draft-pull-requests/) allow you to create a pull request that is still a work in progress and not ready for review. This is useful when you want to share your changes with others but aren't quite ready to merge them or request immediate feedback.    
https://github.blog/2019-02-14-introducing-draft-pull-requests/

- Once your pull request has been reviewed, be sure to **respond** to any feedback you receive. This might involve making additional changes to your code, addressing questions or concerns, or simply thanking reviewers for their feedback.  

- By using the [**re-request review** feature](https://github.blog/changelog/2019-02-21-re-request-review-on-a-pull-request/), you can prompt the reviewer to take another look at your changes and provide feedback if necessary.  

- The [**CODEOWNERS** file](https://github.com/surrealdb/surrealist/blob/main/.github/CODEOWNERS) in GitHub allows you to specify who is responsible for code in a specific part of your repository. You can use this file to automatically assign pull requests to the appropriate people or teams and to ensure that the right people are notified when changes are made to certain files or directories.  

### Finalize the change

- We are actively using **threads** to allow for more detailed and targeted discussions about specific parts of the pull request. A resolved thread means that the conversation has been addressed and the issue has been resolved. Reviewers are responsible for resolving the comment and not the author. The author can simply add a reply comment that the change has been done or decline a request.

- When your pull request is approved, our team will be sure to **merge it responsibly**. This might involve running additional tests or checks, ensuring that the codebase is still functional.

### Summary

To summarize, fork the project and use the `git clone` command to download the repository to your computer. A standard procedure for working on an issue would be to:

1. Clone the repository and download it to your computer.
 
2. Pull all changes from the upstream `main` branch, before creating a new branch - to ensure that your `main` branch is up-to-date with the latest changes.

3. Create a new branch from `main` like `fix/bug-description`.

4. Make changes to the code, and ensure all code changes are formatted correctly.

5. Commit your changes when finished,

6. Push changes to GitHub.

7. Submit your changes for review, by going to your repository on GitHub and clicking the `Compare & pull request` button.

8. Ensure that you have entered a commit message which details the changes, and what the pull request is for.

9. Now submit the pull request by clicking the `Create pull request` button.

10. Wait for code review and approval.

## Security and Privacy

We take the security of SurrealDB code, software, cloud platform, and client SDKs very seriously. If you believe you have found a security vulnerability in SurrealDB, we encourage you to let us know right away. We will investigate all legitimate reports and do our best to quickly fix the problem.

Please report any issues or vulnerabilities to security@surrealdb.com, instead of posting a public issue in GitHub. Please include the SurrealDB version identifier, by running `surreal version` on the command-line, and details on how the vulnerability can be exploited.

When developing, make sure to follow the best industry standards and practices.

## External dependencies

Please avoid introducing new dependencies without consulting the team. New dependencies can be very helpful but also introduce new security and privacy issues, complexity, and impact total docker image size. Adding a new dependency should have vital value on the project with minimum possible risk.

## Other Ways to Help

Pull requests are great, but there are many other areas where you can help.

### Blogging and speaking

Blogging, speaking about, or creating tutorials about one of SurrealDB's many features. Mention [@surrealdb](https://x.com/surrealdb) on X, and email community@surrealdb.com so we can give pointers and tips and help you spread the word by promoting your content on the different SurrealDB communication channels. Please add your blog posts and videos of talks to SurrealDB Labs via the [docs.surrealdb.com](https://github.com/surrealdb/docs.surrealdb.com) repo on GitHub.

### Presenting at meetups

Presenting at meetups and conferences about your SurrealDB projects. Your unique challenges and successes in building things with SurrealDB can provide great speaking material. We’d love to review your talk abstract, so get in touch with us at community@surrealdb.com if you’d like some help!

### Feedback, bugs, and ideas

Sending feedback is a great way for us to understand your different use cases of SurrealDB better. If you want to share your experience with SurrealDB, or if you want to discuss any ideas, you can start a discussion on [GitHub discussions](https://github.com/surrealdb/surrealdb/discussions), chat with the [SurrealDB team on Discord](https://surrealdb.com/discord), or you can tweet [@tobiemh](https://twitter.com/tobiemh) or [@surrealdb](https://twitter.com/surrealdb) on Twitter. If you have any issues or have found a bug, then feel free to create an issue on [**GitHub Issue**](/issues).

### Documentation improvements

Submitting [documentation](https://surrealdb.com/docs) updates, enhancements, designs, or bug fixes, and fixing any spelling or grammar errors will be very much appreciated.

### Joining our community

Join the growing [SurrealDB Community](https://surrealdb.com/community) around the world, for help, ideas, and discussions regarding SurrealDB.

- View our official [Blog](https://surrealdb.com/blog)
- Follow us on [X](https://x.com/surrealdb)
- Connect with us on [LinkedIn](https://www.linkedin.com/company/surrealdb/)
- Join our [Dev community](https://dev.to/surrealdb)
- Chat live with us on [Discord](https://discord.gg/surrealdb)
- Get involved on [Reddit](http://reddit.com/r/surrealdb/)
- Read our blog posts on [Medium](https://medium.com/surrealdb)
- Questions tagged #surrealdb on [StackOverflow](https://stackoverflow.com/questions/tagged/surrealdb)
