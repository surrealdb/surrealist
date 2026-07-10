import type { CloudContext } from "~/types";
import { dedent } from "~/util/dedent";
import { getSpectronUrls } from "../helpers/spectron-urls";
import type { IntegrationStep } from "./types";

export function buildKotlinSteps(context: CloudContext): IntegrationStep[] {
	const { endpoint } = getSpectronUrls(context);

	return [
		{
			title: "Add the dependency",
			description: dedent(`
				The Spectron client ships inside the SurrealDB Kotlin driver, under \`com.surrealdb.kotlin.spectron\`. Add the driver to your Gradle build.

				~~~kotlin
				dependencies {
				    implementation("com.surrealdb:kotlin:0.1.0-SNAPSHOT")
				}
				~~~
			`),
		},
		{
			title: "Initialise the client",
			description: dedent(`
				Create a client for this context. The endpoint and context id are pre-filled from your selection. Every method is a suspend function, so wrap it in runBlocking for synchronous callers.

				~~~kotlin
				import com.surrealdb.kotlin.spectron.Spectron

				val memory = Spectron(
				    contextId = "${context.id}",
				    endpoint = "${endpoint}",
				    apiKey = "your-api-key",
				)
				~~~

				<ApiKey />
			`),
		},
		{
			title: "Capture a memory",
			description: dedent(`
				Record a fact. Spectron pulls out entities, attributes, and relations server-side, so the memory graph fills in on its own.

				~~~kotlin
				import com.surrealdb.kotlin.spectron.model.InferMode

				memory.remember("Hi, I'm Alex. I prefer dark mode.", infer = InferMode.FULL)
				~~~
			`),
		},
		{
			title: "Recall with hybrid search",
			description: dedent(`
				Run one query that blends graph traversal, vector similarity, and structured filters, then get the most relevant memories back in a single call.

				~~~kotlin
				val result = memory.recall("What are the user's preferences?", k = 10, mode = "hybrid")

				result.hits.forEach { println("\${it.score} \${it.text}") }
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
