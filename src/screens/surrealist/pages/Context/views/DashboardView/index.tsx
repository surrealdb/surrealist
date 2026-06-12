import {
	Badge,
	Box,
	Button,
	Group,
	Image,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
	Title,
	UnstyledButton,
} from "@mantine/core";
import {
	HoverGlow,
	Icon,
	iconArrowUpRight,
	iconPackageClosed,
	iconPlay,
	pictoSpectronGradient,
	SectionTitle,
} from "@surrealdb/ui";
import { useMemo } from "react";
import { CONTEXT_VIEW_PAGES, REGION_FLAGS } from "~/constants";
import { useContextNavigator } from "~/hooks/routing";
import { useCloudStore } from "~/stores/cloud";
import type { ContextViewPage } from "~/types";
import type { ContextViewProps } from "../../types";
import classes from "./style.module.scss";

interface NavItem {
	page: ContextViewPage;
	description: string;
}

const EXPLORE_ITEMS: NavItem[] = [
	{
		page: "playground",
		description: "Chat with your context and watch memories form in real time.",
	},
	{
		page: "memories",
		description: "Inspect the agent-learned memory graph that grows with usage.",
	},
	{
		page: "knowledge",
		description: "Ground your context in files, documents, and ingressed data.",
	},
];

const INTEGRATION_ITEMS: NavItem[] = [
	{
		page: "integration",
		description: "Step-by-step setup for Python, JavaScript, and the REST API.",
	},
	{
		page: "api-keys",
		description: "Create keys and connect SDKs, agents, or the REST API.",
	},
];

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
			{/* HERO */}
			<Paper
				p="xl"
				radius="lg"
				variant="glass"
				className={classes.hero}
			>
				<Image
					src={pictoSpectronGradient}
					className={classes.heroArt}
					alt=""
					aria-hidden
				/>
				<Stack
					gap="lg"
					pos="relative"
					style={{ zIndex: 1 }}
				>
					<Box maw={640}>
						<Text
							fz="xs"
							fw={600}
							c="violet.4"
							tt="uppercase"
							style={{ letterSpacing: "0.08em" }}
						>
							Context
						</Text>
						<Title
							fz={{ base: 28, sm: 36 }}
							variant="gradient"
							lh={1}
						>
							{context.name}
						</Title>
						<Group
							gap="xs"
							mt="sm"
						>
							<Badge
								size="sm"
								variant="transparent"
								px={0}
								leftSection={
									<Image
										src={REGION_FLAGS[context.region]}
										w={14}
										mr="xs"
									/>
								}
							>
								{region?.description}
							</Badge>
						</Group>
					</Box>
					<Group
						gap="sm"
						mt="sm"
					>
						<Button
							variant="gradient"
							leftSection={<Icon path={iconPlay} />}
							onClick={() => goToPage("playground")}
						>
							Open playground
						</Button>
						<Button
							onClick={() => goToPage("integration")}
							rightSection={<Icon path={iconPackageClosed} />}
						>
							Integrate Spectron
						</Button>
					</Group>
				</Stack>
			</Paper>
			<Box>
				<SectionTitle
					kicker="Explore"
					order={2}
				>
					All knowledge in one place
				</SectionTitle>
				<SimpleGrid
					mt="xl"
					cols={{ base: 1, sm: 3 }}
					spacing="md"
				>
					{EXPLORE_ITEMS.map((item) => (
						<NavCard
							key={item.page}
							item={item}
							onNavigate={goToPage}
						/>
					))}
				</SimpleGrid>
			</Box>
			<Box>
				<SectionTitle
					kicker="Integrate"
					order={2}
				>
					Connect your tools and services
				</SectionTitle>
				<SimpleGrid
					mt="xl"
					cols={{ base: 1, sm: 2 }}
					spacing="md"
				>
					{INTEGRATION_ITEMS.map((item) => (
						<NavCard
							key={item.page}
							item={item}
							onNavigate={goToPage}
						/>
					))}
				</SimpleGrid>
			</Box>
		</Stack>
	);
}

interface NavCardProps {
	item: NavItem;
	onNavigate: (page: ContextViewPage) => void;
}

function NavCard({ item, onNavigate }: NavCardProps) {
	const meta = CONTEXT_VIEW_PAGES[item.page];

	return (
		<HoverGlow key={item.page}>
			<UnstyledButton
				onClick={() => onNavigate(item.page)}
				style={{ cursor: "pointer" }}
				w="100%"
			>
				<Paper
					p="lg"
					radius="md"
					className={classes.navCard}
				>
					<Group
						gap="md"
						wrap="nowrap"
						align="flex-start"
						pos="relative"
						style={{ zIndex: 1 }}
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
								{item.description}
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
