import {
	ActionIcon,
	Box,
	Button,
	CopyButton,
	Group,
	Image,
	Paper,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
	Tooltip,
	UnstyledButton,
} from "@mantine/core";
import type { Spectron } from "@surrealdb/spectron";
import {
	HoverGlow,
	Icon,
	iconArrowUpRight,
	iconCheck,
	iconCopy,
	iconFile,
	iconFolderSecure,
	iconHistory,
	iconMemory,
	iconOpen,
	iconPackageClosed,
	iconPlay,
	pictoSpectronGradient,
	SectionTitle,
} from "@surrealdb/ui";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { adapter } from "~/adapter";
import { CONTEXT_VIEW_PAGES, REGION_FLAGS } from "~/constants";
import { useContextNavigator } from "~/hooks/routing";
import { useCloudStore } from "~/stores/cloud";
import type { ContextViewPage } from "~/types";
import { ContextHero } from "../../components/ContextHero";
import { useSpectron } from "../../provider";
import type { ContextViewProps } from "../../types";

const EXPLORE_PAGES: ContextViewPage[] = ["playground", "memory", "documents", "scopes"];
const INTEGRATE_PAGES: ContextViewPage[] = ["integration", "api-keys"];

export default function DashboardView({ context }: ContextViewProps) {
	const navigateContext = useContextNavigator();
	const regions = useCloudStore((s) => s.contextRegions);

	const region = useMemo(
		() => regions.find((r) => r.slug === context.region),
		[regions, context.region],
	);

	const goToPage = (page: ContextViewPage) => {
		navigateContext(context.organization_id, context.id, page);
	};

	return (
		<Stack gap={48}>
			<ContextHero
				kicker="Context"
				title={context.name}
				description="Your agent's memory and knowledge layer. Connect an SDK, ground it in documents, and watch its memory grow."
				art={pictoSpectronGradient}
			>
				<Button
					variant="gradient"
					leftSection={<Icon path={iconPlay} />}
					onClick={() => goToPage("playground")}
				>
					Open playground
				</Button>
				<Button
					variant="light"
					rightSection={<Icon path={iconPackageClosed} />}
					onClick={() => goToPage("integration")}
				>
					Integrate
				</Button>
				<Button
					variant="subtle"
					color="slate"
					rightSection={<Icon path={iconOpen} />}
					onClick={() => adapter.openUrl("https://surrealdb.com/spectron")}
				>
					Learn more
				</Button>
			</ContextHero>

			{/* CONTEXT DETAILS */}
			<SimpleGrid
				cols={{ base: 1, sm: 3 }}
				spacing="md"
			>
				<DetailTile label="Region">
					<Group
						gap="xs"
						wrap="nowrap"
					>
						{REGION_FLAGS[context.region] && (
							<Image
								src={REGION_FLAGS[context.region]}
								w={18}
								alt=""
							/>
						)}
						<Text
							fw={500}
							c="bright"
							truncate
						>
							{region?.description ?? context.region}
						</Text>
					</Group>
				</DetailTile>
				<CopyableDetail
					label="Host"
					value={context.host}
				/>
				<CopyableDetail
					label="Context ID"
					value={context.id}
				/>
			</SimpleGrid>

			{/* AT A GLANCE */}
			<Box>
				<SectionTitle
					kicker="At a glance"
					order={2}
				>
					What's in this context
				</SectionTitle>
				<Box mt="xl">
					<OverviewStats />
				</Box>
			</Box>

			{/* EXPLORE */}
			<Box>
				<SectionTitle
					kicker="Explore"
					order={2}
				>
					Everything in one place
				</SectionTitle>
				<SimpleGrid
					mt="xl"
					cols={{ base: 1, sm: 2 }}
					spacing="md"
				>
					{EXPLORE_PAGES.map((page) => (
						<NavCard
							key={page}
							page={page}
							onNavigate={goToPage}
						/>
					))}
				</SimpleGrid>
			</Box>

			{/* INTEGRATE */}
			<Box>
				<SectionTitle
					kicker="Integrate"
					order={2}
				>
					Connect your tools and agents
				</SectionTitle>
				<SimpleGrid
					mt="xl"
					cols={{ base: 1, sm: 2 }}
					spacing="md"
				>
					{INTEGRATE_PAGES.map((page) => (
						<NavCard
							key={page}
							page={page}
							onNavigate={goToPage}
						/>
					))}
				</SimpleGrid>
			</Box>
		</Stack>
	);
}

// ─── Context details ───

function DetailTile({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<Paper
			p="md"
			radius="md"
		>
			<Text
				fz="xs"
				fw={600}
				tt="uppercase"
				c="slate"
				style={{ letterSpacing: "0.06em" }}
			>
				{label}
			</Text>
			<Box mt={6}>{children}</Box>
		</Paper>
	);
}

function CopyableDetail({ label, value }: { label: string; value: string }) {
	return (
		<DetailTile label={label}>
			<Group
				gap="xs"
				wrap="nowrap"
				align="center"
			>
				<Box
					c="bright"
					flex={1}
				>
					{value}
				</Box>
				<CopyButton value={value}>
					{({ copied, copy }) => (
						<Tooltip label={copied ? "Copied" : "Copy"}>
							<ActionIcon
								variant="subtle"
								color={copied ? "green" : "slate"}
								size="sm"
								onClick={copy}
								aria-label={`Copy ${label}`}
							>
								<Icon path={copied ? iconCheck : iconCopy} />
							</ActionIcon>
						</Tooltip>
					)}
				</CopyButton>
			</Group>
		</DetailTile>
	);
}

// ─── At-a-glance stats (SDK-powered) ───

function OverviewStats() {
	const { client, status } = useSpectron();

	if (status !== "ready" || !client) {
		return (
			<SimpleGrid
				cols={{ base: 2, sm: 4 }}
				spacing="md"
			>
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton
						key={i}
						h={96}
						radius="md"
					/>
				))}
			</SimpleGrid>
		);
	}

	return (
		<SimpleGrid
			cols={{ base: 2, sm: 4 }}
			spacing="md"
		>
			<StatCard
				icon={iconFile}
				label="Documents"
				queryKey="documents"
				client={client}
				resolve={async (c) => (await c.documents.list({ pageSize: 1 })).total}
			/>
			<StatCard
				icon={iconMemory}
				label="Entities"
				queryKey="entities"
				client={client}
				resolve={async (c) => {
					const state = await c.state();
					return (
						(state.identity?.entities?.length ?? 0) +
						(state.knowledge?.entities?.length ?? 0) +
						(state.context?.entities?.length ?? 0)
					);
				}}
			/>
			<StatCard
				icon={iconFolderSecure}
				label="Scopes"
				queryKey="scopes"
				client={client}
				resolve={async (c) => {
					const scopes = await c.scopes.list();
					return Array.isArray(scopes) ? scopes.length : 0;
				}}
			/>
			<StatCard
				icon={iconHistory}
				label="Queries"
				queryKey="queries"
				client={client}
				resolve={async (c) => (await c.traces.stats()).totalQueries}
			/>
		</SimpleGrid>
	);
}

interface StatCardProps {
	icon: string;
	label: string;
	queryKey: string;
	client: Spectron;
	resolve: (client: Spectron) => Promise<number>;
}

function StatCard({ icon, label, queryKey, client, resolve }: StatCardProps) {
	const query = useQuery({
		queryKey: ["spectron", client.contextId, "overview-stat", queryKey],
		queryFn: () => resolve(client),
		retry: false,
		staleTime: 30_000,
	});

	return (
		<Paper
			p="md"
			radius="md"
		>
			<Group
				gap="sm"
				wrap="nowrap"
			>
				<ThemeIcon
					size={36}
					radius="md"
					variant="light"
					color="violet"
				>
					<Icon path={icon} />
				</ThemeIcon>
				<Box>
					{query.isPending ? (
						<Skeleton
							h={24}
							w={48}
							mb={4}
						/>
					) : (
						<Text
							fz={24}
							fw={700}
							c="bright"
							lh={1.1}
						>
							{query.isError ? "—" : (query.data ?? 0).toLocaleString()}
						</Text>
					)}
					<Text
						fz="xs"
						c="slate"
					>
						{label}
					</Text>
				</Box>
			</Group>
		</Paper>
	);
}

// ─── Navigation cards ───

interface NavCardProps {
	page: ContextViewPage;
	onNavigate: (page: ContextViewPage) => void;
}

function NavCard({ page, onNavigate }: NavCardProps) {
	const meta = CONTEXT_VIEW_PAGES[page];

	return (
		<HoverGlow>
			<UnstyledButton
				onClick={() => onNavigate(page)}
				style={{ cursor: "pointer" }}
				w="100%"
			>
				<Paper
					p="lg"
					radius="md"
				>
					<Group
						gap="md"
						wrap="nowrap"
						align="flex-start"
					>
						<ThemeIcon
							size={44}
							radius="md"
							variant="light"
							color="violet"
						>
							<Icon
								path={meta.icon}
								size="lg"
							/>
						</ThemeIcon>
						<Box flex={1}>
							<Text
								fw={600}
								fz="md"
								c="bright"
							>
								{meta.name}
							</Text>
							<Text
								mt={4}
								fz="sm"
								lh={1.5}
								className="selectable"
							>
								{meta.description}
							</Text>
						</Box>
						<Icon
							path={iconArrowUpRight}
							size="sm"
							c="slate"
						/>
					</Group>
				</Paper>
			</UnstyledButton>
		</HoverGlow>
	);
}
