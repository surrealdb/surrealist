import type { CloudContext } from "~/types";
import { dedent } from "~/util/dedent";
import { getSpectronUrls } from "../helpers/spectron-urls";
import type { IntegrationStep } from "./types";

export function buildOpenClawSteps(context: CloudContext): IntegrationStep[] {
	const { endpoint } = getSpectronUrls(context);

	return [
		{
			title: "Install the plugin",
			description: dedent(`
				The Spectron plugin backs OpenClaw's agent memory with this context: relevant memory is recalled before each turn, every turn is persisted afterwards, and the agent gains deliberate memory tools. Requires OpenClaw \`>= 2026.4.27\`.

				~~~bash
				openclaw plugins install @surrealdb/spectron-openclaw
				openclaw spectron setup
				openclaw gateway restart
				~~~

				\`openclaw spectron setup\` prints the config block and the hook flags to add.
			`),
		},
		{
			title: "Create an API key",
			description: dedent(`
				The plugin authenticates with a scoped API key bound to your principal. Create one for this context.

				<ApiKey />
			`),
		},
		{
			title: "Configuration reference",
			description: dedent(`
				Configuration lives in \`~/.openclaw/openclaw.json\` under \`plugins.entries.spectron\`. Point it at this context, and enable both hook flags — \`allowConversationAccess\` lets the plugin persist each turn, \`allowPromptInjection\` lets it inject recalled memory.

				~~~json
				{
				  "plugins": {
				    "entries": {
				      "spectron": {
				        "enabled": true,
				        "hooks": {
				          "allowConversationAccess": true,
				          "allowPromptInjection": true
				        },
				        "config": {
				          "endpoint": "${endpoint}",
				          "apiKey": "your-api-key",
				          "context": "${context.id}"
				        }
				      }
				    }
				  }
				}
				~~~
			`),
		},
		{
			title: "Verify",
			description: dedent(`
				Restart the gateway, then confirm the connection is healthy and the plugin is active.

				~~~bash
				openclaw spectron health
				openclaw spectron status
				~~~
			`),
		},
		{
			title: "Explore Spectron",
			description: dedent(`
				The agent can also call the \`spectron_recall\`, \`spectron_remember\`, \`spectron_context\`, \`spectron_reflect\`, \`spectron_forget\`, \`spectron_upload\`, and \`spectron_inspect\` tools directly. See the documentation for the full plugin reference.

				<Documentation />
			`),
		},
	];
}
