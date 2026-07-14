import {
	brandClaude,
	brandCloudflare,
	brandCodex,
	brandCrewAI,
	brandCursorDark,
	brandCursorLight,
	brandDart,
	brandElixir,
	brandEveDark,
	brandEveLight,
	brandFacebookMessenger,
	brandGo,
	brandGoogleAgent,
	brandHaskell,
	brandHermesDark,
	brandHermesLight,
	brandJavaScript,
	brandKotlin,
	brandLangchain,
	brandMastraDark,
	brandMastraLight,
	brandN8N,
	brandOpenAiDark,
	brandOpenAiLight,
	brandOpenClaw,
	brandPydantic,
	brandPython,
	brandSMS,
	brandStrands,
	brandSwift,
	brandTanStackDark,
	brandTanStackLight,
	brandTelegram,
	brandVercelDark,
	brandVercelLight,
	brandVSCode,
	brandWhatsApp,
	brandZapier,
	brandZedDark,
	brandZedLight,
	pictoEmbeddinggGradient,
	pictoMCPGradient,
	pictoSpectronGradient,
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
	| "crew-ai"
	| "google-adk"
	| "pydantic-ai"
	| "strands"
	| "vercel-ai"
	| "eve"
	| "cloudflare"
	| "tanstack-ai"
	| "mastra"
	| "whatsapp"
	| "telegram"
	| "facebook-messenger"
	| "sms-rcs"
	| "surrealdb"
	| "slack"
	| "notion"
	| "google-drive"
	| "github"
	| "linear"
	| "confluence"
	| "databricks"
	| "snowflake";

/** A brand image, either a single asset or a light/dark pair resolved by theme. */
export type IntegrationImage = string | { light: string; dark: string };

export interface IntegrationMeta {
	label: string;
	/** Short verb shown on the card, e.g. "Connect via MCP". */
	connect?: string;
	/** Brand image asset (full colour). */
	img?: IntegrationImage;
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
	cursor: {
		label: "Cursor",
		connect: "Connect via MCP",
		img: { light: brandCursorLight, dark: brandCursorDark },
	},
	openclaw: { label: "OpenClaw", connect: "Connect via plugin", img: brandOpenClaw },
	hermes: {
		label: "Hermes",
		connect: "Connect via plugin",
		img: { light: brandHermesLight, dark: brandHermesDark },
	},
	vscode: { label: "VS Code", connect: "Connect via MCP", img: brandVSCode },
	zed: {
		label: "Zed",
		connect: "Connect via MCP",
		img: { light: brandZedLight, dark: brandZedDark },
	},
	mcp: { label: "MCP", connect: "Connect via MCP", img: pictoMCPGradient },
	n8n: { label: "n8n", connect: "Connect via node", img: brandN8N },
	zapier: { label: "Zapier", connect: "Connect via MCP", img: brandZapier },
	langchain: { label: "LangChain", connect: "Connect via package", img: brandLangchain },
	"openai-agents": {
		label: "OpenAI Agents",
		connect: "Connect via package",
		img: { light: brandOpenAiLight, dark: brandOpenAiDark },
	},
	"crew-ai": { label: "CrewAI", connect: "Connect via package", img: brandCrewAI },
	"google-adk": { label: "Google ADK", connect: "Connect via package", img: brandGoogleAgent },
	"pydantic-ai": { label: "Pydantic AI", connect: "Connect via package", img: brandPydantic },
	strands: { label: "Strands Agents", connect: "Connect via package", img: brandStrands },
	"vercel-ai": {
		label: "Vercel AI SDK",
		connect: "Connect via package",
		img: { light: brandVercelLight, dark: brandVercelDark },
	},
	eve: {
		label: "EveJS",
		connect: "Connect via package",
		img: { light: brandEveLight, dark: brandEveDark },
	},
	cloudflare: { label: "Cloudflare", connect: "Connect via MCP", img: brandCloudflare },
	"tanstack-ai": {
		label: "TanStack AI",
		connect: "Connect via MCP",
		img: { light: brandTanStackLight, dark: brandTanStackDark },
	},
	mastra: {
		label: "Mastra",
		connect: "Connect via package",
		img: { light: brandMastraLight, dark: brandMastraDark },
	},
	whatsapp: { label: "WhatsApp", img: brandWhatsApp, comingSoon: true },
	telegram: { label: "Telegram", img: brandTelegram, comingSoon: true },
	"facebook-messenger": {
		label: "Facebook Messenger",
		img: brandFacebookMessenger,
		comingSoon: true,
	},
	"sms-rcs": { label: "SMS / RCS", img: brandSMS, comingSoon: true },
	surrealdb: { label: "SurrealDB", comingSoon: true },
	slack: { label: "Slack", comingSoon: true },
	notion: { label: "Notion", comingSoon: true },
	"google-drive": { label: "Google Drive", comingSoon: true },
	github: { label: "GitHub", comingSoon: true },
	linear: { label: "Linear", comingSoon: true },
	confluence: { label: "Confluence", comingSoon: true },
	databricks: { label: "Databricks", comingSoon: true },
	snowflake: { label: "Snowflake", comingSoon: true },
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
		integrations: [
			"langchain",
			"openai-agents",
			"crew-ai",
			"google-adk",
			"pydantic-ai",
			"strands",
			"eve",
			"vercel-ai",
			"cloudflare",
			"tanstack-ai",
			"mastra",
		],
	},
	{
		title: "Automation platforms",
		description: "Give your automation workflows access to this context's memory.",
		integrations: ["n8n", "zapier"],
	},
	{
		title: "Messaging",
		description: "Bring this context's memory to the channels you are already messaging on.",
		integrations: ["whatsapp", "telegram", "facebook-messenger", "sms-rcs"],
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
