import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { type PropsWithChildren, useEffect, useRef } from "react";
import { isDesktop } from "~/adapter";

const AUTH_DOMAIN = (import.meta.env.VITE_CLOUD_AUTH_BASE ?? "").replace(/^https?:\/\//, "");
const AUTH0_TENANT = import.meta.env.VITE_AUTH0_DOMAIN ?? "";
const CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID ?? "";
const AUTH_AUDIENCE = `https://${AUTH0_TENANT}/api/v2/`;

const DESKTOP_CALLBACK = "surrealist://callback/auth";

const CODE_RE = /[?&]code=[^&]+/;
const STATE_RE = /[?&]state=[^&]+/;

// Snapshot the landing URL before any router rewrites can strip query params.
// Auth0 appends ?code=…&state=… on redirect; the app router's useLayoutEffect
// may replace the URL before the SDK's useEffect fires.
const INITIAL_URL = window.location.href;
const INITIAL_SEARCH = window.location.search;

type TokenGetter = () => Promise<string>;
let _getAccessToken: TokenGetter | null = null;

/**
 * Get an Auth0 access token from outside of React.
 * Only available after the AuthProvider has mounted.
 */
export async function getAccessToken(): Promise<string> {
	if (!_getAccessToken) {
		throw new Error("AuthProvider has not been initialized");
	}

	return _getAccessToken();
}

function hasAuthParams(search: string) {
	return CODE_RE.test(search) && STATE_RE.test(search);
}

/**
 * Processes the Auth0 redirect callback using the URL captured at page load.
 * This is necessary because the app router may strip query params before the
 * Auth0Provider's internal useEffect gets a chance to read them.
 */
function CallbackHandler({ children }: PropsWithChildren) {
	const { handleRedirectCallback } = useAuth0();
	const handled = useRef(false);

	useEffect(() => {
		if (isDesktop || !hasAuthParams(INITIAL_SEARCH) || handled.current) {
			return;
		}

		handled.current = true;
		handleRedirectCallback(INITIAL_URL);
	}, [handleRedirectCallback]);

	return children;
}

function TokenBridge({ children }: PropsWithChildren) {
	const { getAccessTokenSilently } = useAuth0();

	useEffect(() => {
		_getAccessToken = getAccessTokenSilently;
		return () => {
			_getAccessToken = null;
		};
	}, [getAccessTokenSilently]);

	return children;
}

export function AuthProvider({ children }: PropsWithChildren) {
	return (
		<Auth0Provider
			domain={AUTH_DOMAIN}
			clientId={CLIENT_ID}
			authorizationParams={{
				redirect_uri: isDesktop ? DESKTOP_CALLBACK : window.location.origin,
				audience: AUTH_AUDIENCE,
				scope: "openid profile email offline_access",
			}}
			cacheLocation="localstorage"
			useRefreshTokens
			skipRedirectCallback
		>
			<CallbackHandler>
				<TokenBridge>{children}</TokenBridge>
			</CallbackHandler>
		</Auth0Provider>
	);
}
