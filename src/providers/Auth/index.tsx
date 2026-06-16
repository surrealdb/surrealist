import {
	Auth0ContextInterface,
	Auth0Provider as BaseAuth0Provider,
	User,
	useAuth0,
} from "@auth0/auth0-react";
import { shutdown } from "@intercom/messenger-js-sdk";
import { useStable } from "@surrealdb/ui";
import { createContext, type PropsWithChildren, useContext, useEffect, useRef } from "react";
import { useSearchParams } from "wouter";
import { adapter, isDesktop } from "~/adapter";
import { SignInRedirect } from "~/components/SignInRedirect";
import { useAbsoluteLocation } from "~/hooks/routing";
import { openCloudOnboardingModal } from "~/modals/cloud-onboarding";
import { tagEvent } from "~/util/analytics";
import { broadcastAuthEvent } from "~/util/auth-broadcast";
import { showErrorNotification } from "~/util/helpers";
import { callback, computeReturnPath } from "./helpers";
import { useAuthCallbackFlow } from "./hooks/use-auth-callback-flow";
import { useAuthWindowSync } from "./hooks/use-auth-window-sync";
import type { SignInOptions, SignOutOptions } from "./types";

export type { SignInOptions, SignOutOptions };

const CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID ?? "";
const AUTH_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN ?? "";
const AUTH_AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE ?? "";

const AUTH_RETURN_URL = callback("auth/return");
const AUTH_LAUNCH_URL = callback("auth/launch");
const AUTH_OVERVIEW_URL = callback("");

export { AUTH_RETURN_URL, AUTH_LAUNCH_URL };

type AccessTokenFn = Auth0ContextInterface["getAccessTokenSilently"];

export interface AuthContext {
	user: User | undefined;
	isAuthenticated: boolean;
	isLoading: boolean;
	getAccessToken: AccessTokenFn;
	signIn: (options?: SignInOptions) => Promise<void>;
	signOut: (options?: SignOutOptions) => Promise<void>;
}

const AuthContext = createContext<AuthContext | null>(null);

let _getAccessToken: (() => Promise<string>) | null = null;
let _user: User | undefined;

/**
 * Returns the current id token
 */
export async function getAccessToken(): Promise<string> {
	if (!_getAccessToken) {
		throw new Error("AuthProvider has not been initialised");
	}

	return _getAccessToken();
}

/**
 * Returns the current user snapshot
 */
export function getUserSnapshot(): User | undefined {
	return _user;
}

/**
 * Returns the current authentication context
 */
export function useAuthentication(): AuthContext {
	const ctx = useContext(AuthContext);

	if (!ctx) {
		throw new Error("useAuthentication must be used within an AuthProvider");
	}

	return ctx;
}

function TokenBridge({ children }: PropsWithChildren) {
	const { user, loginWithRedirect, getAccessTokenSilently, logout, isAuthenticated, isLoading } =
		useAuth0();

	const [params] = useSearchParams();
	const [, navigate] = useAbsoluteLocation();

	const signInRef = useRef(false);

	const isVerifyPending = user?.email_verified === false;
	const isSigninPrompt = params.get("signin") === "true";

	const signIn = useStable(async (options?: SignInOptions) => {
		const { screen, redirect } = options ?? {};

		const isExternal = !redirect || isDesktop;
		const redirectUrl = isDesktop ? AUTH_LAUNCH_URL : AUTH_RETURN_URL;

		await loginWithRedirect({
			openUrl: isExternal ? openExternal : undefined,
			authorizationParams: {
				redirect_uri: isExternal ? redirectUrl : AUTH_OVERVIEW_URL,
				screen_hint: screen,
			},
			appState: {
				returnTo: isExternal ? undefined : computeReturnPath(params),
			},
		});
	});

	const signOut = useStable(async (options?: SignOutOptions) => {
		const { localOnly } = options ?? {};

		shutdown();
		navigate("/");

		await broadcastAuthEvent("signout");

		if (localOnly) {
			await logout({ openUrl: false });
			return;
		}

		await logout({
			openUrl: async (url) => {
				const opened = await adapter.openUrl(url);

				if (!opened) {
					showErrorNotification({
						title: "Failed to open authentication",
						content: "Please make sure popup blockers are disabled.",
					});
				}
			},
			logoutParams: {
				returnTo: isDesktop ? AUTH_LAUNCH_URL : AUTH_RETURN_URL,
			},
		});
	});

	const handleSignIn = useStable((user: User) => {
		tagEvent("auth_signin", {
			provider: user.sub?.split("|")[0] ?? "unknown",
			verified: user.email_verified,
			email: user.email,
		});
	});

	const handleSignOut = useStable(() => {
		tagEvent("auth_signout");
	});

	// Pin access token retriever reference
	useEffect(() => {
		_getAccessToken = getAccessTokenSilently;

		return () => {
			_getAccessToken = null;
		};
	}, [getAccessTokenSilently]);

	// Pin user snapshot reference
	useEffect(() => {
		_user = user;
	}, [user]);

	// Sign in detection
	useEffect(() => {
		if (!isAuthenticated) {
			if (signInRef.current) handleSignOut();
			signInRef.current = false;
			return;
		}

		if (user) {
			signInRef.current = true;
			handleSignIn(user);
		}
	}, [isAuthenticated, user]);

	// Email verification prompt
	useEffect(() => {
		if (isVerifyPending) {
			openCloudOnboardingModal();
		}
	}, [isVerifyPending]);

	useAuthCallbackFlow();
	useAuthWindowSync();

	return (
		<AuthContext.Provider
			value={{
				user,
				isAuthenticated,
				isLoading,
				signIn,
				signOut,
				getAccessToken: getAccessTokenSilently,
			}}
		>
			{isSigninPrompt ? <SignInRedirect /> : children}
		</AuthContext.Provider>
	);
}

export function AuthProvider({ children }: PropsWithChildren) {
	const [, navigate] = useAbsoluteLocation();

	return (
		<BaseAuth0Provider
			domain={AUTH_DOMAIN}
			clientId={CLIENT_ID}
			useRefreshTokens
			cacheLocation="localstorage"
			authorizationParams={{
				redirect_uri: AUTH_RETURN_URL,
				audience: AUTH_AUDIENCE,
				scope: "openid profile email offline_access",
			}}
			onRedirectCallback={(appState) => {
				if (appState?.returnTo) {
					navigate(appState.returnTo);
				}
			}}
		>
			<TokenBridge>{children}</TokenBridge>
		</BaseAuth0Provider>
	);
}

async function openExternal(url: string) {
	const opened = await adapter.openUrl(url);

	if (!opened) {
		showErrorNotification({
			title: "Failed to open authentication",
			content: "Please make sure popup blockers are disabled.",
		});
	}
}
