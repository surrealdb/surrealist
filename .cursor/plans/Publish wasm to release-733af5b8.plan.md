---
name: Untitled Plan
overview: ""
todos: []
isProject: false
---

---
todos:
  - id: "add-wasm-job"
    content: "Add wasm job to .github/workflows/ci.yml that builds via scripts/build-wasm.sh, runs npm pack in pkg/, and uploads pkg/*.tgz to the GitHub Release on v* tags"
    status: pending
  - id: "pin-wasm-pack-action"
    content: "Resolve and pin the jetli/wasm-pack-action commit SHA (matching the SHA-pinning convention used by the other actions in the workflow)"
    status: pending
isProject: false
---
## Goal

When a `v*` tag is pushed to `surrealql-language-server`, also publish the browser-targeted WebAssembly module to the GitHub Release (alongside the existing native binaries). Surrealist (and other consumers) can then `npm install` it directly from the release URL instead of relying on the local `file:../surrealql-language-server/pkg` link in [package.json](../surrealist/package.json) line 123.

## Approach

Extend [.github/workflows/ci.yml](../surrealql-language-server/.github/workflows/ci.yml) with a new `wasm` job. No version verification — we trust whatever `wasm-pack` writes into `pkg/package.json` from the Cargo version (per the user's choice).

### New job: `wasm`

- Trigger: `if: startsWith(github.ref, 'refs/tags/v')` (same gate as the existing `release` and `publish` jobs).
- Runner: `ubuntu-latest` (stock clang on Ubuntu has the wasm32 backend, so the macOS-specific Homebrew LLVM logic in [scripts/build-wasm.sh](../surrealql-language-server/scripts/build-wasm.sh) is a no-op there).
- Permissions: `contents: write` (needed by `softprops/action-gh-release` to attach the asset).
- Steps:
  1. `actions/checkout` (pinned by SHA, matching the existing style).
  2. Clone the sibling grammar repo into `../surrealql-tree-sitter` (same step the other jobs use).
  3. `dtolnay/rust-toolchain@…` with `toolchain: 1.94.0` and `targets: wasm32-unknown-unknown`.
  4. `Swatinem/rust-cache@…` for cargo caching, consistent with the other jobs.
  5. Install `wasm-pack` via `jetli/wasm-pack-action` (pinned by SHA) — avoids the long `cargo install wasm-pack` compile.
  6. Run `bash scripts/build-wasm.sh`. This emits `pkg/surrealql_language_server{.js,.d.ts,_bg.wasm,_bg.wasm.d.ts}` plus a refreshed `pkg/package.json` and copies of `LICENSE`/`README.md`.
  7. `npm pack` from `pkg/` to produce `surrealql-language-server-<version>.tgz` (npm standard format; installable via `npm install https://github.com/.../releases/download/<tag>/surrealql-language-server-<version>.tgz`).
  8. `softprops/action-gh-release@…` (already used by `release`, same pinned SHA) with `files: pkg/*.tgz` to attach the tarball to the release.

### Snippet sketch

```yaml
wasm:
    if: startsWith(github.ref, 'refs/tags/v')
    permissions:
        contents: write
    runs-on: ubuntu-latest
    steps:
        - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd
        - name: Check out tree-sitter grammar
          run: git clone --depth 1 https://github.com/surrealdb/surrealql-tree-sitter ../surrealql-tree-sitter
        - uses: dtolnay/rust-toolchain@3c5f7ea28cd621ae0bf5283f0e981fb97b8a7af9
          with:
              toolchain: 1.94.0
              targets: wasm32-unknown-unknown
        - uses: Swatinem/rust-cache@c19371144df3bb44fab255c43d04cbc2ab54d1c4
          name: Cache Rust Artifacts
        - name: Install wasm-pack
          uses: jetli/wasm-pack-action@<pinned-sha>
          with:
              version: latest
        - name: Build wasm package
          run: bash scripts/build-wasm.sh
        - name: Pack npm tarball
          working-directory: pkg
          run: npm pack
        - name: Upload to GitHub Release
          uses: softprops/action-gh-release@3bb12739c298aeb8a4eeaf626c5b8d85266b0e65
          with:
              files: pkg/*.tgz
```

### Notes / non-goals

- No npm publish — explicitly out of scope per the user's choice (option 1b).
- No version verification — explicitly out of scope per the user's choice (option 2a). The existing `cargo publish` step already fails fast on mismatch.
- No changes to surrealist in this PR. A follow-up could swap [`package.json`](../surrealist/package.json) line 123 to depend on the GitHub release tarball URL or migrate to npm later.
- `pkg/.gitignore` is `*` and the `pkg/` files are produced fresh each build, so nothing needs to be committed.