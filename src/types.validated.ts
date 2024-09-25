import * as v from "valibot";

export const SurrealistEmbeddedConfigSchema = v.object({
	activeConnection: v.optional(v.string()),
	connections: v.optional(
		v.array(
			v.object({
				id: v.string(),
				name: v.string(),
				authentication: v.object({
					protocol: v.string(),
					hostname: v.string(),
					mode: v.string(),
					username: v.string(),
					password: v.optional(v.string()),
					namespace: v.optional(v.string()),
					database: v.optional(v.string()),
				}),
			})
		),
		[] // defaults to empty array
	),
});
