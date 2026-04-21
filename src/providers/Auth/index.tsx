import { Auth0Provider as BaseAuth0Provider, User, useAuth0 } from "@auth0/auth0-react";
import { shutdown } from "@intercom/messenger-js-sdk";
import { useStable } from "@surrealdb/ui";
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo } from "react";
import { useSearchParams } from "wouter";
import { adapter, isDesktop } from "~/adapter";
import { SignInRedirect } from "~/components/SignInRedirect";
import { useAbsoluteLocation } from "~/hooks/routing";
import { openCloudOnboardingModal } from "~/modals/cloud-onboarding";
import { tagEvent } from "~/util/analytics";
import { broadcastAuthEvent } from "~/util/auth-broadcast";
import { exposeDebug, showErrorNotification } from "~/util/helpers";
import { useAuthCallbackFlow } from "./auth-callback-flow";
import { callback, computeReturnPath } from "./helpers";
import { emailVerifiedMockDebug, useEmailVerifiedMock } from "./mocks";
import type { SignInOptions } from "./types";

export type { SignInOptions };

const CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID ?? "";
const AUTH_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN ?? "";
const AUTH_AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE ?? "";

const AUTH_RETURN_URL = callback("auth/return");
const AUTH_LAUNCH_URL = callback("auth/launch");
const AUTH_OVERVIEW_URL = callback("overview");

export { AUTH_RETURN_URL, AUTH_LAUNCH_URL };

export interface AuthContext {
	user: User | undefined;
	isAuthenticated: boolean;
	isLoading: boolean;
	getAccessToken: () => Promise<string>;
	signIn: (options?: SignInOptions) => Promise<void>;
	signOut: () => Promise<void>;
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
	const {
		user: realUser,
		loginWithRedirect,
		getAccessTokenSilently,
		logout,
		isAuthenticated,
		isLoading,
	} = useAuth0();

	const emailVerifiedMock = useEmailVerifiedMock();

	const user = useMemo<User | undefined>(() => {
		if (!realUser || emailVerifiedMock === null) {
			return realUser;
		}

		return {
			...realUser,
			email_verified: emailVerifiedMock === "verified",
		};
	}, [realUser, emailVerifiedMock]);

	const verifyPending = user?.email_verified === false;

	const [params] = useSearchParams();
	const [, navigate] = useAbsoluteLocation();

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

	const signOut = useStable(async () => {
		tagEvent("cloud_signout");
		shutdown();

		navigate("/overview");

		await broadcastAuthEvent("signout");

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

	useEffect(() => {
		_getAccessToken = getAccessTokenSilently;

		return () => {
			_getAccessToken = null;
		};
	}, [getAccessTokenSilently]);

	useEffect(() => {
		_user = user;
	}, [user]);

	useEffect(() => {
		if (verifyPending) {
			openCloudOnboardingModal();
		}
	}, [verifyPending]);

	useEffect(() => {
		exposeDebug(emailVerifiedMockDebug);
	}, []);

	useAuthCallbackFlow();

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
