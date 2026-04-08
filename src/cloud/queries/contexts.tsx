import { useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import type {
	CloudContext,
	ContextApiKey,
	ContextCategory,
	ContextEntity,
	ContextEvent,
	ContextKnowledge,
	ContextMemory,
	ContextStats,
} from "~/types";

const MOCK_MEMORIES: ContextMemory[] = [
	{
		id: "mem-001",
		text: "Julian likes Nesquick",
		userId: "julian",
		categories: ["food", "preferences"],
		metadata: {},
		score: 0.95,
		immutable: false,
		createdAt: "2026-04-01T10:30:00Z",
		updatedAt: "2026-04-01T10:30:00Z",
	},
	{
		id: "mem-002",
		text: "Prefers dark mode in all applications",
		userId: "julian",
		categories: ["preferences", "technology"],
		metadata: {},
		score: 0.92,
		immutable: false,
		createdAt: "2026-04-01T11:00:00Z",
		updatedAt: "2026-04-01T11:00:00Z",
	},
	{
		id: "mem-003",
		text: "Lives in London, United Kingdom",
		userId: "julian",
		categories: ["personal_details"],
		metadata: {},
		score: 0.98,
		immutable: false,
		createdAt: "2026-03-28T09:15:00Z",
		updatedAt: "2026-03-28T09:15:00Z",
	},
	{
		id: "mem-004",
		text: "Works at SurrealDB as a software engineer",
		userId: "julian",
		categories: ["professional"],
		metadata: { company: "SurrealDB", role: "Software Engineer" },
		score: 0.97,
		immutable: false,
		createdAt: "2026-03-28T09:20:00Z",
		updatedAt: "2026-04-02T14:00:00Z",
	},
	{
		id: "mem-005",
		text: "Primary programming languages are TypeScript and Rust",
		userId: "julian",
		categories: ["technology", "professional"],
		metadata: {},
		score: 0.91,
		immutable: false,
		createdAt: "2026-03-29T16:45:00Z",
		updatedAt: "2026-03-29T16:45:00Z",
	},
	{
		id: "mem-006",
		text: "Timezone is GMT/BST (Europe/London)",
		userId: "julian",
		categories: ["personal_details"],
		metadata: { timezone: "Europe/London" },
		score: 0.88,
		immutable: false,
		createdAt: "2026-03-30T08:00:00Z",
		updatedAt: "2026-03-30T08:00:00Z",
	},
	{
		id: "mem-007",
		text: "Prefers concise technical documentation over verbose explanations",
		userId: "julian",
		categories: ["preferences"],
		metadata: {},
		score: 0.85,
		immutable: false,
		createdAt: "2026-03-31T13:20:00Z",
		updatedAt: "2026-03-31T13:20:00Z",
	},
	{
		id: "mem-008",
		text: "Uses Mantine v8 as preferred UI framework",
		userId: "julian",
		categories: ["technology", "preferences"],
		metadata: { framework: "Mantine", version: "8" },
		score: 0.89,
		immutable: false,
		createdAt: "2026-04-02T10:10:00Z",
		updatedAt: "2026-04-02T10:10:00Z",
	},
	{
		id: "mem-009",
		text: "Customer reported billing issue with invoice #INV-2024-0892",
		userId: "support-bot",
		categories: ["support"],
		metadata: { ticket: "TK-4521", priority: "high" },
		score: 0.93,
		immutable: false,
		createdAt: "2026-04-03T11:30:00Z",
		updatedAt: "2026-04-03T14:00:00Z",
	},
	{
		id: "mem-010",
		text: "Customer prefers email communication over phone calls",
		userId: "support-bot",
		categories: ["preferences", "support"],
		metadata: { ticket: "TK-4521" },
		score: 0.86,
		immutable: false,
		createdAt: "2026-04-03T11:35:00Z",
		updatedAt: "2026-04-03T11:35:00Z",
	},
	{
		id: "mem-011",
		text: "Enjoys Italian cuisine, especially pasta carbonara",
		userId: "julian",
		categories: ["food", "preferences"],
		metadata: {},
		score: 0.82,
		immutable: false,
		createdAt: "2026-04-04T19:00:00Z",
		updatedAt: "2026-04-04T19:00:00Z",
	},
	{
		id: "mem-012",
		text: "SurrealDB Cloud deployment region preference is eu-west-1",
		userId: "julian",
		categories: ["technology", "professional"],
		metadata: { provider: "AWS", region: "eu-west-1" },
		score: 0.9,
		immutable: true,
		createdAt: "2026-04-05T09:00:00Z",
		updatedAt: "2026-04-05T09:00:00Z",
	},
	{
		id: "mem-013",
		text: "Resolved billing dispute -- refund issued for $45.00",
		userId: "support-bot",
		categories: ["support"],
		metadata: { ticket: "TK-4521", resolution: "refund" },
		score: 0.94,
		immutable: false,
		createdAt: "2026-04-05T16:20:00Z",
		updatedAt: "2026-04-05T16:20:00Z",
	},
	{
		id: "mem-014",
		text: "Uses VS Code and Cursor as primary code editors",
		userId: "julian",
		categories: ["technology"],
		metadata: {},
		score: 0.87,
		immutable: false,
		createdAt: "2026-04-06T10:00:00Z",
		updatedAt: "2026-04-06T10:00:00Z",
	},
	{
		id: "mem-015",
		text: "Has a pet cat named Pixel",
		userId: "julian",
		categories: ["personal_details"],
		metadata: {},
		score: 0.8,
		immutable: false,
		createdAt: "2026-04-06T12:30:00Z",
		updatedAt: "2026-04-06T12:30:00Z",
	},
	{
		id: "mem-016",
		text: "Onboarding flow completed for new enterprise customer Acme Corp",
		userId: "onboarding-agent",
		categories: ["support", "professional"],
		metadata: { customer: "Acme Corp", plan: "enterprise" },
		score: 0.91,
		immutable: false,
		createdAt: "2026-04-07T08:45:00Z",
		updatedAt: "2026-04-07T08:45:00Z",
	},
	{
		id: "mem-017",
		text: "Favourite beverage is flat white coffee",
		userId: "julian",
		categories: ["food", "preferences"],
		metadata: {},
		score: 0.79,
		immutable: false,
		createdAt: "2026-04-07T15:00:00Z",
		updatedAt: "2026-04-07T15:00:00Z",
	},
	{
		id: "mem-018",
		text: "British English spelling should be used in all communications",
		userId: "julian",
		categories: ["preferences"],
		metadata: {},
		score: 0.96,
		immutable: true,
		createdAt: "2026-04-08T09:00:00Z",
		updatedAt: "2026-04-08T09:00:00Z",
	},
];

const MOCK_KNOWLEDGE: ContextKnowledge = {
	nodes: [
		{ id: "n-julian", label: "Julian", type: "person", memoryCount: 13 },
		{ id: "n-london", label: "London", type: "city", memoryCount: 2 },
		{ id: "n-surrealdb", label: "SurrealDB", type: "company", memoryCount: 3 },
		{ id: "n-typescript", label: "TypeScript", type: "technology", memoryCount: 2 },
		{ id: "n-rust", label: "Rust", type: "technology", memoryCount: 2 },
		{ id: "n-mantine", label: "Mantine", type: "technology", memoryCount: 1 },
		{ id: "n-dark-mode", label: "Dark mode", type: "preference", memoryCount: 1 },
		{ id: "n-nesquick", label: "Nesquick", type: "food", memoryCount: 1 },
		{ id: "n-carbonara", label: "Pasta carbonara", type: "food", memoryCount: 1 },
		{ id: "n-support-bot", label: "support-bot", type: "agent", memoryCount: 3 },
		{ id: "n-onboarding", label: "onboarding-agent", type: "agent", memoryCount: 1 },
		{ id: "n-acme", label: "Acme Corp", type: "company", memoryCount: 1 },
	],
	relations: [
		{
			source: "Julian",
			sourceType: "person",
			relationship: "lives_in",
			target: "London",
			targetType: "city",
		},
		{
			source: "Julian",
			sourceType: "person",
			relationship: "works_at",
			target: "SurrealDB",
			targetType: "company",
		},
		{
			source: "Julian",
			sourceType: "person",
			relationship: "uses",
			target: "TypeScript",
			targetType: "technology",
		},
		{
			source: "Julian",
			sourceType: "person",
			relationship: "uses",
			target: "Rust",
			targetType: "technology",
		},
		{
			source: "Julian",
			sourceType: "person",
			relationship: "uses",
			target: "Mantine",
			targetType: "technology",
		},
		{
			source: "Julian",
			sourceType: "person",
			relationship: "prefers",
			target: "Dark mode",
			targetType: "preference",
		},
		{
			source: "Julian",
			sourceType: "person",
			relationship: "likes",
			target: "Nesquick",
			targetType: "food",
		},
		{
			source: "Julian",
			sourceType: "person",
			relationship: "likes",
			target: "Pasta carbonara",
			targetType: "food",
		},
		{
			source: "SurrealDB",
			sourceType: "company",
			relationship: "located_in",
			target: "London",
			targetType: "city",
		},
		{
			source: "SurrealDB",
			sourceType: "company",
			relationship: "builds",
			target: "SurrealDB",
			targetType: "technology",
		},
		{
			source: "support-bot",
			sourceType: "agent",
			relationship: "serves",
			target: "Julian",
			targetType: "person",
		},
		{
			source: "onboarding-agent",
			sourceType: "agent",
			relationship: "onboarded",
			target: "Acme Corp",
			targetType: "company",
		},
	],
};

const MOCK_EVENTS: ContextEvent[] = [
	{
		id: "evt-001",
		eventType: "ADD",
		status: "SUCCEEDED",
		memoryText: "British English spelling should be used in all communications",
		userId: "julian",
		latency: 34,
		createdAt: "2026-04-08T09:00:00Z",
		completedAt: "2026-04-08T09:00:00Z",
	},
	{
		id: "evt-002",
		eventType: "ADD",
		status: "SUCCEEDED",
		memoryText: "Favourite beverage is flat white coffee",
		userId: "julian",
		latency: 42,
		createdAt: "2026-04-07T15:00:00Z",
		completedAt: "2026-04-07T15:00:01Z",
	},
	{
		id: "evt-003",
		eventType: "ADD",
		status: "SUCCEEDED",
		memoryText: "Onboarding flow completed for new enterprise customer Acme Corp",
		userId: "onboarding-agent",
		latency: 67,
		createdAt: "2026-04-07T08:45:00Z",
		completedAt: "2026-04-07T08:45:00Z",
	},
	{
		id: "evt-004",
		eventType: "ADD",
		status: "SUCCEEDED",
		memoryText: "Has a pet cat named Pixel",
		userId: "julian",
		latency: 29,
		createdAt: "2026-04-06T12:30:00Z",
		completedAt: "2026-04-06T12:30:00Z",
	},
	{
		id: "evt-005",
		eventType: "UPDATE",
		status: "SUCCEEDED",
		memoryText: "Works at SurrealDB as a software engineer",
		userId: "julian",
		latency: 51,
		createdAt: "2026-04-02T14:00:00Z",
		completedAt: "2026-04-02T14:00:00Z",
	},
	{
		id: "evt-006",
		eventType: "ADD",
		status: "SUCCEEDED",
		memoryText: "Resolved billing dispute -- refund issued for $45.00",
		userId: "support-bot",
		latency: 38,
		createdAt: "2026-04-05T16:20:00Z",
		completedAt: "2026-04-05T16:20:00Z",
	},
	{
		id: "evt-007",
		eventType: "DELETE",
		status: "SUCCEEDED",
		memoryText: "Customer lives in Manchester",
		userId: "support-bot",
		latency: 18,
		createdAt: "2026-04-03T14:05:00Z",
		completedAt: "2026-04-03T14:05:00Z",
	},
	{
		id: "evt-008",
		eventType: "ADD",
		status: "FAILED",
		memoryText: "Prefers async communication channels",
		userId: "julian",
		latency: 1200,
		createdAt: "2026-04-02T09:00:00Z",
		completedAt: "2026-04-02T09:00:01Z",
	},
	{
		id: "evt-009",
		eventType: "ADD",
		status: "PENDING",
		memoryText: "Interested in graph databases and knowledge graphs",
		userId: "julian",
		latency: 0,
		createdAt: "2026-04-08T09:05:00Z",
		completedAt: null,
	},
	{
		id: "evt-010",
		eventType: "UPDATE",
		status: "RUNNING",
		memoryText: "Customer prefers email communication over phone calls",
		userId: "support-bot",
		latency: 0,
		createdAt: "2026-04-08T09:04:00Z",
		completedAt: null,
	},
];

const MOCK_ENTITIES: ContextEntity[] = [
	{
		id: "ent-julian",
		name: "julian",
		type: "user",
		totalMemories: 13,
		createdAt: "2026-03-28T09:15:00Z",
		updatedAt: "2026-04-08T09:00:00Z",
	},
	{
		id: "ent-support-bot",
		name: "support-bot",
		type: "agent",
		totalMemories: 3,
		createdAt: "2026-04-03T11:30:00Z",
		updatedAt: "2026-04-05T16:20:00Z",
	},
	{
		id: "ent-onboarding",
		name: "onboarding-agent",
		type: "agent",
		totalMemories: 1,
		createdAt: "2026-04-07T08:45:00Z",
		updatedAt: "2026-04-07T08:45:00Z",
	},
];

const MOCK_CATEGORIES: ContextCategory[] = [
	{ name: "preferences", description: "User preferences and personal choices", count: 7 },
	{ name: "technology", description: "Technology stack, tools and frameworks", count: 5 },
	{ name: "professional", description: "Work-related and career information", count: 4 },
	{ name: "food", description: "Food and beverage preferences", count: 3 },
	{
		name: "personal_details",
		description: "Personal information and biographical details",
		count: 3,
	},
	{ name: "support", description: "Customer support interactions and resolutions", count: 4 },
];

const MOCK_STATS: ContextStats = {
	totalMemories: 18,
	totalUsers: 1,
	totalAgents: 2,
	totalKnowledgeNodes: 12,
	totalKnowledgeRelations: 12,
	memoriesAddedToday: 2,
	memoriesAddedThisWeek: 6,
	searchesToday: 47,
	avgSearchLatencyMs: 42,
	graphEnabled: true,
	lastActivity: "2026-04-08T09:05:00Z",
};

const MOCK_API_KEYS: ContextApiKey[] = [
	{
		id: "key-001",
		name: "Production key",
		key: "sk-ctx-prod-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
		maskedKey: "sk-ctx-****...o5p6",
		createdAt: "2026-03-09T10:00:00Z",
		lastUsedAt: "2026-04-08T07:12:00Z",
		expiresAt: null,
		scopes: ["memories:read", "memories:write", "knowledge:read", "knowledge:write"],
	},
	{
		id: "key-002",
		name: "Development key",
		key: "sk-ctx-dev-q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2",
		maskedKey: "sk-ctx-****...e1f2",
		createdAt: "2026-04-01T10:00:00Z",
		lastUsedAt: "2026-04-07T16:45:00Z",
		expiresAt: "2026-07-01T00:00:00Z",
		scopes: ["memories:read", "memories:write", "knowledge:read", "knowledge:write"],
	},
	{
		id: "key-003",
		name: "Read-only integration",
		key: "sk-ctx-ro-g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8",
		maskedKey: "sk-ctx-****...u7v8",
		createdAt: "2026-03-25T14:00:00Z",
		lastUsedAt: null,
		expiresAt: null,
		scopes: ["memories:read", "knowledge:read"],
	},
];

function delay(ms = 300) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function getMockContexts(): CloudContext[] {
	return [
		{
			id: `ds-068na13ir1tnf3f689dd8c8ruc-2`,
			name: "Staging Context",
			state: "ready",
			region: "eu-west-1",
			version: "2.0.0",
			organization_id: "068na13ir1tnf3f689dd8c8ruc",
		},
		{
			id: `ds-068na13ir1tnf3f689dd8c8ruc-3`,
			name: "Production Context",
			state: "ready",
			region: "us-east-1",
			version: "2.0.0",
			organization_id: "068na13ir1tnf3f689dd8c8ruc",
		},
	];
}

export function useCloudOrganizationContextsQuery(organization?: string) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "contexts", { org: organization }],
		refetchInterval: 15_000,
		enabled: !!organization && authState === "authenticated",
		queryFn: async () => {
			return getMockContexts();
		},
	});
}

export function useCloudContextQuery(contextId?: string) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "context", contextId],
		enabled: !!contextId && authState === "authenticated",
		queryFn: async () => {
			await delay();
			return getMockContexts().find((context) => context.id === contextId);
		},
	});
}

export function useCloudContextStatsQuery(contextId?: string) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "context", contextId, "stats"],
		refetchInterval: 30_000,
		enabled: !!contextId && authState === "authenticated",
		queryFn: async () => {
			await delay();
			return MOCK_STATS;
		},
	});
}

export function useCloudContextMemoriesQuery(contextId?: string) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "context", contextId, "memories"],
		enabled: !!contextId && authState === "authenticated",
		queryFn: async () => {
			await delay();
			return MOCK_MEMORIES;
		},
	});
}

export function useCloudContextKnowledgeQuery(contextId?: string) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "context", contextId, "knowledge"],
		enabled: !!contextId && authState === "authenticated",
		queryFn: async () => {
			await delay();
			return MOCK_KNOWLEDGE;
		},
	});
}

export function useCloudContextEventsQuery(contextId?: string) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "context", contextId, "events"],
		refetchInterval: 10_000,
		enabled: !!contextId && authState === "authenticated",
		queryFn: async () => {
			await delay();
			return MOCK_EVENTS;
		},
	});
}

export function useCloudContextEntitiesQuery(contextId?: string) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "context", contextId, "entities"],
		enabled: !!contextId && authState === "authenticated",
		queryFn: async () => {
			await delay();
			return MOCK_ENTITIES;
		},
	});
}

export function useCloudContextCategoriesQuery(contextId?: string) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "context", contextId, "categories"],
		enabled: !!contextId && authState === "authenticated",
		queryFn: async () => {
			await delay();
			return MOCK_CATEGORIES;
		},
	});
}

export function useCloudContextApiKeysQuery(contextId?: string) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "context", contextId, "api-keys"],
		enabled: !!contextId && authState === "authenticated",
		queryFn: async () => {
			await delay();
			return MOCK_API_KEYS;
		},
	});
}
