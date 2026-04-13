import { Auth0Provider as BaseAuth0Provider, useAuth0 } from "@auth0/auth0-react";
import { type PropsWithChildren, useEffect } from "react";
import { callback } from "./helpers";

const CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID ?? "";
const AUTH_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN ?? "";
const AUTH_AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE ?? "";

const AUTH_RETURN_URL = callback("auth/return");
const AUTH_LAUNCH_URL = callback("auth/launch");

type TokenGetter = () => Promise<string>;
let _getAccessToken: TokenGetter | null = null;

/**
 * Get an Auth0 access token from outside of React.
 * Only available after the AuthProvider has mounted.
 */
export async function getAccessToken(): Promise<string> {
	if (!_getAccessToken) {
		throw new Error("AuthProvider has not been initialised");
	}

	return _getAccessToken();
}

export { AUTH_RETURN_URL, AUTH_LAUNCH_URL };

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
		<BaseAuth0Provider
			domain={AUTH_DOMAIN}
			clientId={CLIENT_ID}
			authorizationParams={{
				redirect_uri: AUTH_RETURN_URL,
				audience: AUTH_AUDIENCE,
				scope: "openid profile email offline_access",
			}}
			cacheLocation="localstorage"
			skipRedirectCallback
			useRefreshTokens
		>
			<TokenBridge>{children}</TokenBridge>
		</BaseAuth0Provider>
	);
}
