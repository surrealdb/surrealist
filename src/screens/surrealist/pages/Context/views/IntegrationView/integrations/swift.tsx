import type { CloudContext } from "~/types";
import { dedent } from "~/util/dedent";
import { getSpectronUrls } from "../helpers/spectron-urls";
import type { IntegrationStep } from "./types";

export function buildSwiftSteps(context: CloudContext): IntegrationStep[] {
	const { endpoint } = getSpectronUrls(context);

	return [
		{
			title: "Add the package",
			description: dedent(`
				The surrealdb.swift package ships a Spectron library product. Add it to your target's dependencies in Package.swift.

				~~~swift
				.product(name: "Spectron", package: "surrealdb.swift")
				~~~
			`),
		},
		{
			title: "Initialise the client",
			description: dedent(`
				Create a client for this context. The endpoint and context id are pre-filled from your selection. The client is Sendable and built on async/await.

				~~~swift
				import Spectron

				let memory = try Spectron(
				    context: "${context.id}",
				    endpoint: "${endpoint}",
				    apiKey: "your-api-key"
				)
				~~~

				<ApiKey />
			`),
		},
		{
			title: "Capture a memory",
			description: dedent(`
				Record a memory. Spectron pulls out entities, attributes, and relations, so the memory graph fills in on its own.

				~~~swift
				_ = try await memory.remember("Hi, I'm Alex. I prefer dark mode.", role: .user)
				~~~
			`),
		},
		{
			title: "Recall with hybrid search",
			description: dedent(`
				Run one query that blends graph traversal, vector similarity, and structured filters, then get the most relevant memories back in a single call.

				~~~swift
				let hits = try await memory.recall("What are the user's preferences?", k: 10)
				~~~
			`),
		},
		{
			title: "Explore Spectron",
			description: dedent(`
				The official documentation covers the rest of what Spectron can do.

				<Documentation />
			`),
		},
	];
}
