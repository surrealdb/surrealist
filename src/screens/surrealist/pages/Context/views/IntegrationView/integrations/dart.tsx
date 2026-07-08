import type { CloudContext } from "~/types";
import { dedent } from "~/util/dedent";
import { getSpectronUrls } from "../helpers/spectron-urls";
import type { IntegrationStep } from "./types";

export function buildDartSteps(context: CloudContext): IntegrationStep[] {
	const { endpoint } = getSpectronUrls(context);

	return [
		{
			title: "Add the dependency",
			description: dedent(`
				The Spectron client ships inside the \`surrealdb\` package. Add it to your \`pubspec.yaml\` and run \`dart pub get\` (or \`flutter pub get\`).

				~~~yaml
				dependencies:
				  surrealdb:
				~~~
			`),
		},
		{
			title: "Initialise the client",
			description: dedent(`
				Create a client for this context. The endpoint and context id are pre-filled from your selection.

				~~~dart
				import 'package:surrealdb/spectron.dart';

				final client = Spectron(
				    context: "${context.id}",
				    endpoint: "${endpoint}",
				    apiKey: "your-api-key",
				);
				~~~

				<ApiKey />
			`),
		},
		{
			title: "Capture a memory",
			description: dedent(`
				Record a fact. Spectron extracts entities, attributes, and relations server-side so the memory graph grows automatically.

				~~~dart
				await client.remember("Hi, I'm Alex. I prefer dark mode.", scopes: "user/alex");
				~~~
			`),
		},
		{
			title: "Recall with hybrid search",
			description: dedent(`
				Run a single query that blends graph traversal, vector similarity, and structured filters, returning the most relevant memories ranked for the agent in one round-trip.

				~~~dart
				final hits = await client.recall("What are the user's preferences?", k: 10);
				~~~
			`),
		},
		{
			title: "Explore Spectron",
			description: dedent(`
				Discover the full potential of Spectron with the official documentation.

				<Documentation />
			`),
		},
	];
}
