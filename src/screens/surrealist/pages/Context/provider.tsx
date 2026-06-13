import { Spectron } from "@surrealdb/spectron";
import { createContext, type PropsWithChildren, useContext, useMemo } from "react";
import { useSpectronAccessTokenQuery } from "~/cloud/queries/contexts";
import type { CloudContext } from "~/types";

export type SpectronStatus = "loading" | "ready" | "error";

export interface SpectronContextValue {
	/** The live SDK client, or `null` until an access token has been minted. */
	client: Spectron | null;
	/** The context API origin (e.g. `https://abc.aws-use1.surrealdb.cloud`). */
	endpoint: string;
	/** The Spectron context id. */
	contextId: string;
	/** The caller's own principal id (from the access token), once known. */
	principalId: string | null;
	status: SpectronStatus;
	error: Error | null;
	/** Force a re-mint of the access token and rebuild the client. */
	refresh: () => void;
}

const SpectronCtx = createContext<SpectronContextValue | null>(null);

export interface SpectronProviderProps extends PropsWithChildren {
	context: CloudContext;
	organizationId: string;
}

/**
 * Initialises the Spectron SDK once for the active context and exposes it to
 * every context page via {@link useSpectron}.
 *
 * Authentication uses a Cloud-brokered, TTL-bounded access token minted for the
 * caller's own principal (`POST .../spectron_contexts/{id}/access_tokens`). The
 * token is refreshed ahead of expiry by the underlying query, and the client is
 * transparently rebuilt whenever the token rotates.
 */
export function SpectronProvider({ context, organizationId, children }: SpectronProviderProps) {
	const endpoint = `https://${context.host}`;
	const tokenQuery = useSpectronAccessTokenQuery(organizationId, context.id);

	const token = tokenQuery.data?.key ?? null;
	const principalId = tokenQuery.data?.principal_id ?? null;

	const client = useMemo(() => {
		if (!token) return null;

		return new Spectron({
			context: context.id,
			apiKey: token,
			endpoint,
		});
	}, [token, context.id, endpoint]);

	const status: SpectronStatus = client ? "ready" : tokenQuery.isError ? "error" : "loading";

	const value = useMemo<SpectronContextValue>(
		() => ({
			client,
			endpoint,
			contextId: context.id,
			principalId,
			status,
			error: (tokenQuery.error as Error | null) ?? null,
			refresh: () => {
				tokenQuery.refetch();
			},
		}),
		[client, endpoint, context.id, principalId, status, tokenQuery.error, tokenQuery.refetch],
	);

	return <SpectronCtx.Provider value={value}>{children}</SpectronCtx.Provider>;
}

/**
 * Access the Spectron SDK context. Throws when used outside a
 * {@link SpectronProvider}.
 */
export function useSpectron() {
	const ctx = useContext(SpectronCtx);

	if (!ctx) {
		throw new Error("useSpectron must be used within a SpectronProvider");
	}

	return ctx;
}

/** Convenience accessor returning the live client, or `null` when not ready. */
export function useSpectronClient() {
	return useSpectron().client;
}
