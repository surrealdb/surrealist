# Surrealist — SurrealDB instance OAuth (client)

Surrealist can authenticate to a SurrealDB server that exposes the OAuth thin broker (`/access/*`, RFC 8414 discovery).

## Flows

1. **Default OAuth (discovery)** — `GET /.well-known/oauth-authorization-server` returns 200. Surrealist offers “Use OAuth” and stores `authorization_endpoint` / `token_endpoint`. Authorize and token requests **omit `client_id`**.
2. **Manual OAuth** — User selects OAuth mode. Access method name is **optional** unless a namespace or database is set (scoped `/access/{ns}/{db}/…` paths). Sign-in happens when you **connect**, not from the connection settings screen.

## Connect-time sign-in

When connecting with OAuth and no valid session (or refresh fails), Surrealist opens a small modal and then a browser window for the PKCE redirect. Tokens are saved on the connection before the RPC session is established.

## Session management

From the connection status menu, the **OAuth Session** section shows when the session JWT and refresh token expire (when the server reports expiry). **Sign out** clears stored tokens and disconnects; **Sign in again** runs the OAuth flow and reconnects if you were connected.

## Refresh tokens

- **Default OAuth** — when discovery (`/.well-known/oauth-authorization-server`) lists `refresh_token` in `grant_types_supported`, Surrealist enables refresh tokens automatically.
- **Manual OAuth** — use the **Use refresh tokens** checkbox on the connection form (not shown on the default-OAuth screen). Switching from default to manual keeps the discovery-derived setting.

**Surrealist does not send OAuth scopes.** Scopes are applied by SurrealDB when it redirects you to the IdP: they come from `DEFINE ACCESS … SCOPES` on the server (e.g. `offline_access` for Okta). Surrealist only calls `/access/authorize` and `/access/token`; SurrealDB builds the Okta authorize URL with the configured scopes.

Refresh tokens are issued by the IdP according to those server scopes (not by a Surrealist scope parameter). The **Use refresh tokens** checkbox (manual OAuth) controls whether Surrealist **stores** a `refresh_token` from the token response. Default-OAuth connections store refresh tokens when the server returns them unless you explicitly turn the setting off. **Sign in again** after changing scopes or the setting.

If the menu shows refresh **Unavailable** while the setting is on, the last sign-in did not return a `refresh_token` (check server scopes) or you have not re-authenticated since enabling the setting.

Refresh expiry in the menu (`~Xd left`) requires `refresh_token_expires_in` in the `POST /access/token` JSON. When the IdP omits it (common with Okta), the menu shows **Available** if a refresh token is stored. The refresh row is hidden when refresh tokens are disabled on the connection.

## Callback URL

Register in `DEFINE ACCESS … REDIRECT_URIS` (see **Authentication → JWT → OAuth** for copyable values):

- **Web / dev popup:** `http://localhost:1420/auth/surreal/callback` or `https://app.surrealdb.com/auth/surreal/callback`
- **Desktop app:** `https://app.surrealdb.com/auth/surreal/launch` — hosted page opens `surrealist://surreal-oauth?…` (same pattern as SurrealDB Cloud `auth/launch` → `surrealist://callback/auth?…`)

Do not use a custom-scheme URL (`surrealist://…`) as the IdP redirect URI; the IdP must redirect to HTTPS, then Surrealist deep-links into the app.

## Defining OAuth access in Surrealist

Use **Authentication** (ROOT / NAMESPACE / DATABASE) → **New access method** → **JWT** tab to configure verification, OIDC issuer, and **OAuth** (`WITH OAUTH` under JWT). Existing methods can be updated with **Save** (`DEFINE ACCESS OVERWRITE`).

## Server requirements

- **SurrealDB Enterprise** (or a dev OSS build with `--features oauth,jwks`) must expose `/access/*` and `/.well-known/oauth-authorization-server`.
- Set `--public-url` to the externally visible base URL when behind a reverse proxy.
- `DEFINE CONFIG DEFAULT OAUTH ACCESS <method>` for discovery (returns **404** on `/.well-known/oauth-authorization-server` until this is set)
- `DEFINE ACCESS … WITH OAUTH` and IdP configuration

## Transport security

Surrealist accepts `http://` issuers and broker URLs (via `oauth4webapi`'s `allowInsecureRequests`) so local and self-hosted SurrealDB instances on private networks work out of the box. **For any production or shared deployment, front SurrealDB with HTTPS** — OAuth carries bearer credentials, and authorization codes / refresh tokens over plain HTTP are recoverable by anyone on the path.
