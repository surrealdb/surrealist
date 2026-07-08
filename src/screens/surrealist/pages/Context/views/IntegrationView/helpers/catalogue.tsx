import {
	brandClaude,
	brandCodex,
	brandCursor,
	brandDart,
	brandElixir,
	brandGithub,
	brandGo,
	brandHaskell,
	brandJavaScript,
	brandKotlin,
	brandLangchain,
	brandN8N,
	brandOpenAi,
	brandPython,
	brandSurrealDB,
	brandSwift,
	brandVercel,
	brandVSCode,
	pictoBotGradient,
	pictoConnectGradient,
	pictoEmbeddinggGradient,
	pictoMCPGradient,
	pictoSidekickGradient,
	pictoSpectronGradient,
	pictoZapierGradient,
	pictoZedGradient,
} from "@surrealdb/ui";

/** Stable identifier for an integration, used for deep-linking (`?integration=<id>`). */
export type IntegrationId =
	| "python"
	| "javascript"
	| "go"
	| "swift"
	| "kotlin"
	| "haskell"
	| "elixir"
	| "dart"
	| "api"
	| "cli"
	| "claude-code"
	| "codex"
	| "cursor"
	| "openclaw"
	| "hermes"
	| "vscode"
	| "zed"
	| "mcp"
	| "n8n"
	| "zapier"
	| "langchain"
	| "openai-agents"
	| "eve"
	| "surrealdb"
	| "slack"
	| "notion"
	| "google-drive"
	| "github"
	| "linear"
	| "confluence"
	| "databricks"
	| "snowflake";

export interface IntegrationMeta {
	label: string;
	/** Short verb shown on the card, e.g. "Connect via MCP". */
	connect?: string;
	/** Brand image asset (full colour). */
	img?: string;
	/** Monochrome icon path (falls back when no brand image exists). */
	icon?: string;
	/** When set, the card is a non-interactive "Coming soon" placeholder. */
	comingSoon?: boolean;
}

export interface IntegrationCategory {
	title: string;
	description: string;
	/** Integrations shown under this category, in display order. */
	integrations: IntegrationId[];
}

export const INTEGRATION_META: Record<IntegrationId, IntegrationMeta> = {
	python: { label: "Python", connect: "Connect via SDK", img: brandPython },
	javascript: { label: "JavaScript", connect: "Connect via SDK", img: brandJavaScript },
	go: { label: "Go", connect: "Connect via SDK", img: brandGo },
	swift: { label: "Swift", connect: "Connect via SDK", img: brandSwift },
	kotlin: { label: "Kotlin", connect: "Connect via SDK", img: brandKotlin },
	haskell: { label: "Haskell", connect: "Connect via SDK", img: brandHaskell },
	elixir: { label: "Elixir", connect: "Connect via SDK", img: brandElixir },
	dart: { label: "Dart", connect: "Connect via SDK", img: brandDart },
	api: { label: "REST API", connect: "Connect via API", img: pictoEmbeddinggGradient },
	cli: { label: "Spectron CLI", connect: "Connect via CLI", img: pictoSpectronGradient },
	"claude-code": { label: "Claude Code", connect: "Connect via MCP", img: brandClaude },
	codex: { label: "OpenAI Codex", connect: "Connect via MCP", img: brandCodex },
	cursor: { label: "Cursor", connect: "Connect via MCP", img: brandCursor },
	openclaw: { label: "OpenClaw", connect: "Connect via MCP", img: pictoBotGradient },
	hermes: { label: "Hermes", connect: "Connect via MCP", img: pictoSidekickGradient },
	vscode: { label: "VS Code", connect: "Connect via MCP", img: brandVSCode },
	zed: { label: "Zed", connect: "Connect via MCP", img: pictoZedGradient },
	mcp: { label: "MCP", connect: "Connect via MCP", img: pictoMCPGradient },
	n8n: { label: "n8n", connect: "Connect via node", img: brandN8N },
	zapier: { label: "Zapier", connect: "Connect via MCP", img: pictoZapierGradient },
	langchain: { label: "LangChain", connect: "Connect via package", img: brandLangchain },
	"openai-agents": { label: "OpenAI Agents", connect: "Connect via package", img: brandOpenAi },
	eve: { label: "EveJS", connect: "Connect via package", img: brandVercel },
	surrealdb: { label: "SurrealDB", img: brandSurrealDB, comingSoon: true },
	slack: { label: "Slack", img: pictoConnectGradient, comingSoon: true },
	notion: { label: "Notion", img: pictoConnectGradient, comingSoon: true },
	"google-drive": { label: "Google Drive", img: pictoConnectGradient, comingSoon: true },
	github: { label: "GitHub", img: brandGithub, comingSoon: true },
	linear: { label: "Linear", img: pictoConnectGradient, comingSoon: true },
	confluence: { label: "Confluence", img: pictoConnectGradient, comingSoon: true },
	databricks: { label: "Databricks", img: pictoConnectGradient, comingSoon: true },
	snowflake: { label: "Snowflake", img: pictoConnectGradient, comingSoon: true },
};

/**
 * The integration catalogue. Order is significant — categories render top to
 * bottom, and the integrations within each render in the order listed here.
 */
export const INTEGRATION_CATEGORIES: IntegrationCategory[] = [
	{
		title: "SDKs & API",
		description: "Talk to this context directly from your own code.",
		integrations: [
			"cli",
			"javascript",
			"python",
			"go",
			"swift",
			"kotlin",
			"haskell",
			"elixir",
			"dart",
			"api",
		],
	},
	{
		title: "Agents & coding tools",
		description:
			"Connect your AI agents and coding assistants to this context for persistent memory.",
		integrations: [
			"claude-code",
			"codex",
			"cursor",
			"openclaw",
			"hermes",
			"vscode",
			"zed",
			"mcp",
		],
	},
	{
		title: "Frameworks",
		description: "Wire this context into your agent framework of choice.",
		integrations: ["langchain", "openai-agents", "eve"],
	},
	{
		title: "Automation platforms",
		description: "Give your automation workflows access to this context's memory.",
		integrations: ["n8n", "zapier"],
	},
	{
		title: "Connectors",
		description: "Sync memory to and from the tools and data platforms your team already uses.",
		integrations: [
			"surrealdb",
			"slack",
			"notion",
			"google-drive",
			"github",
			"linear",
			"confluence",
			"databricks",
			"snowflake",
		],
	},
];

export function isIntegrationId(value: string | undefined): value is IntegrationId {
	return value !== undefined && value in INTEGRATION_META;
}
