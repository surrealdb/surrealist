import * as v from "valibot";

// only "root" mode to be used as of now
export const AuthModeSchema = v.union([
	v.literal("none"),
	v.literal("root"),
	v.literal("namespace"),
	v.literal("database"),
]);

// "mem" protocol not needed in embedded config
export const ProtocolSchema = v.union([
	v.literal("http"),
	v.literal("https"),
	v.literal("ws"),
	v.literal("wss"),
	v.literal("indxdb"),
]);

export const InstanceConfigSchema = v.object({
	telemetry: v.optional(v.boolean(), true),
	connections: v.optional(
		v.array(
			v.object({
				id: v.string(),
				name: v.string(),
				defaultNamespace: v.optional(v.string()),
				defaultDatabase: v.optional(v.string()),
				authentication: v.optional(
					v.object({
						protocol: ProtocolSchema,
						hostname: v.string(),
						mode: AuthModeSchema,
						namespace: v.optional(v.string()),
						database: v.optional(v.string()),
					}),
				),
			}),
		),
		[],
	),
});

export type InstanceConfig = v.InferOutput<typeof InstanceConfigSchema>;
