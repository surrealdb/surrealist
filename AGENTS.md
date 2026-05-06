# SurrealDB Frontend AGENTS.md

## Tech stack

- **Framework**: React with Vite
- **UI**: Mantine v8 (`@mantine/core`, `@mantine/hooks`) and SurrealDB UI Kit
(`@surrealdb/ui`)
- **Styles**: SCSS modules, Mantine theme (from `@surrealdb/ui`)
- **Linting**: Biome

## References

- [Mantine](https://mantine.dev/llms.txt): UI
- [Vite](https://vite.dev/llms.txt): Build tool

## UI and components

### Prefer existing components

- **Mantine**: Prefer Mantine components and styling props. Use the docs as
reference: [Mantine Core](https://mantine.dev/core/package/).
- **SurrealDB UI Kit**: Use components and assets from `@surrealdb/ui` where
possible (e.g. `Icon`, pictos, brand assets, `RenderMarkdown`, `useSwitch`,
`clsx`, `Spacer`). Check the package exports before introducing alternatives
or new abstractions.

### Avoid creating new components when not needed

- Prefer composing Mantine and `@surrealdb/ui` rather than adding new custom
components.
- If a new component would be shared across SurrealDB frontends, suggest adding
it to the SurrealDB UI Kit instead of implementing it only in this repo.

## Layout and semantics

- **No raw `<div>`**: Use Mantine’s `<Box>` for generic layout/containers.
- **Semantic elements**: Use `<Box component="element">` for semantics, e.g.
`<Box component="section">`, `<Box component="footer">`,
`<Box component="main">`, `<Box component="nav">`
- **Links**: Use `<Anchor>` instead of `<a>` for links.

## Styling

- **Prefer Mantine styling props** over custom CSS when possible, e.g.
`mt="xl"`, `fz="sm"`, `display="flex"`, `gap="md"`.
- **Prefer SCSS modules** over inline styles. Name modules `style.module.scss`
and import as:
  ```ts
  import classes from "./style.module.scss";
  ```
- Class names in CSS should be in kebab-case, and are automatically converted to
camelCase when used in JavaScript.
- Use `className={classes.xyz}` for module-driven layout and visuals; keep
inline styles only when necessary (e.g. dynamic values).
- Never use c="dimmed" or "dimmed" in any other context. Instead use the default text color e.g. omit "c"

## Text selection

The app sets `user-select: none` on `body` (see `src/assets/styles/global.scss`). Most UI therefore cannot be highlighted unless opted in.

**Enable selection** by adding the global class `selectable` to the element that wraps the copyable text (e.g. `className="selectable"` on `Text`, `Stack`, `Group`, `Table.Td`, or `Code` as appropriate). `input`, `textarea`, CodeMirror tooltips, and `[contenteditable]` remain selectable without this class.

**Prefer selectable for** content users may need to copy or quote: personal or account details (names, emails, usernames), organisation or resource identifiers shown as plain text, prices and billing lines, plan or product descriptions and feature lists, alert and helper body copy, API keys and endpoints when shown outside inputs, table cells with data, and breadcrumb labels that represent the current resource (see `PageBreadcrumbs`’ optional `selectable` on items).

**Leave unselectable** chrome and structure: page titles (`PrimaryTitle`), field labels (`Label`, input labels), button labels, navigation tabs, and short UI labels that are not “data”.

When adding shared UI (e.g. cards, `PropertyValue`), apply `selectable` to the value/readout, not to the label column.

## Tips

- Use `bun run qa` to run the linter and formatter without making changes.
- Use `bun run qau` to run the linter and formatter and make changes.

## Summary

### Do's

- Use Mantine + `@surrealdb/ui` first
- Use `<Box>` and `<Box component="…">`
- Use Mantine props (`mt`, `fz`, etc.)
- Use SCSS modules `style.module.scss`
- Suggest UI Kit for shared components
- Use `className="selectable"` on copyable text blocks where it helps users

### Don'ts

- Add new components without checking existing ones
- Use plain `<div>`, `<section>`, etc.
- Reach for inline `style` or one-off CSS when props suffice
- Rely on inline styles for static styling
- Implement shared UI only in this repo
- Mark titles, labels, and purely decorative copy as non-selectable by default (omit `selectable`)

