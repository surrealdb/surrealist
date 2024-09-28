import * as v from "valibot";
import type { AuthMode, Protocol } from "./types";

const createAuthModeSchema = () => {
	// only "root" mode to be used as of now
	const authModes: AuthMode[] = ["none", "root"];
	return v.union(authModes.map((mode) => v.literal(mode)));
};

const createProtocolSchema = () => {
	// "mem" protocol not needed in embedded config
	const protocols: Protocol[] = ["http", "https", "ws", "wss", "indxdb"];
	return v.union(protocols.map((protocol) => v.literal(protocol)));
};

const AuthModeSchema = createAuthModeSchema();
const ProtocolSchema = createProtocolSchema();

export const SurrealistEmbeddedConfigSchema = v.object({
	groupName: v.optional(v.string(), "Embedded"),
	activeConnection: v.optional(v.string()),
	connections: v.optional(
		v.array(
			v.object({
				id: v.string(),
				name: v.string(),
				authentication: v.object({
					protocol: ProtocolSchema,
					hostname: v.string(),
					mode: AuthModeSchema,
					username: v.string(),
					password: v.optional(v.string()),
					namespace: v.optional(v.string()),
					database: v.optional(v.string()),
				}),
			}),
		),
		[], // defaults to empty array
	),
});
