# Code Review Guidelines

## Always check

- **Security**: credentials and tokens must not appear in console logs or error messages.
- **Components**: Mantine components should be preferred over HTML elements. Use `<Box>` instead of `<div>`.
- **UI Kit**: the UI should make use of the @surrealdb/ui package where possible. Usage of the "dimmed" color should be avoided in favor of "slate" or "obsidian" colors.
- **Light theme**: hardcoded "slate" or "obsidian" colors that aren't neutral (shade 5) should define distinct light and dark variants using `const isLight = useIsLight()` and for example `isLight ? "obsidian.2" : "obsidian.7"`.
- **Release Changelogs**: version bumps on release branches should be accompanied by a changelog entry in the `src/assets/changelogs` directory. The changelog should feature a title, date, and a list of changes.
- **Dependency changes**: new external packages require justification. Prefer replacing small utility packages with helper functions in the codebase.

## Skip

- Formatting and linting errors (enforced by `bun run qau`)