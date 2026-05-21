#!/usr/bin/env bash
set -e

echo "CONTEXT=$CONTEXT"

# Disable the in-place `.wasm` gzip pass (see `vite-plugin-compression2` in
# `vite.config.ts`). The S3 production deploy works around it by uploading
# WASM with an explicit `--content-encoding gzip` flag (see
# `.github/workflows/push-release.yaml`), but Netlify's CDN does not reliably
# pass through gzipped bodies stored under a `.wasm` extension, which leaves
# `WebAssembly.instantiateStreaming` reading garbage bytes and aborting with
# `Response body loading was aborted`. Shipping the raw `.wasm` modules sidesteps
# the entire Netlify content-encoding negotiation; text assets are still gzipped
# on the fly by Netlify itself.
export VITE_SURREALIST_COMPRESS=false

bun run build