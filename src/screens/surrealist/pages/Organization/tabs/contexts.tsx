import {
	Anchor,
	Box,
	Button,
	Divider,
	Group,
	List,
	Modal,
	Paper,
	Select,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	TextInput,
	ThemeIcon,
} from "@mantine/core";
import {
	Icon,
	iconChevronRight,
	iconClose,
	iconOpen,
	iconSearch,
	iconSpectron,
	Spacer,
	VideoPlayer,
} from "@surrealdb/ui";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { hasOrganizationRoles, isOrganisationRestricted, ORG_ROLES_ADMIN } from "~/cloud/helpers";
import { useCloudOrganizationContextsQuery } from "~/cloud/queries/contexts";
import { ActionButton } from "~/components/ActionButton";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useBoolean } from "~/hooks/boolean";
import { useOnboarding } from "~/hooks/onboarding";
import { useContextNavigator } from "~/hooks/routing";
import { useCloudStore } from "~/stores/cloud";
import type { CloudContext } from "~/types";
import type { OrganizationTabProps } from "../types";

const GRID_COLUMNS = {
	xs: 1,
	sm: 2,
	lg: 3,
};

function ContextCard({
	context,
	regions,
	onClick,
}: {
	context: CloudContext;
	regions: { slug: string; description: string }[];
	onClick: () => void;
}) {
	return (
		<Anchor
			variant="glow"
			c="var(--mantine-color-text)"
			onClick={onClick}
			style={{ cursor: "pointer" }}
		>
			<Paper p="lg">
				<Group
					wrap="nowrap"
					align="stretch"
					mt={-3}
				>
					<Group
						gap="lg"
						wrap="nowrap"
					>
						<ThemeIcon
							color="obsidian"
							variant="light"
							size="xl"
						>
							<Icon
								size="xl"
								path={iconSpectron}
							/>
						</ThemeIcon>
						<Stack
							gap="xs"
							miw={0}
						>
							<Group
								miw={0}
								wrap="nowrap"
							>
								<Text
									c="bright"
									fw={600}
									fz="xl"
									truncate
								>
									{context.name}
								</Text>
							</Group>
							<Text size="sm">
								{regions.find((r) => r.slug === context.region)?.description ??
									context.region}
							</Text>
						</Stack>
					</Group>
				</Group>
			</Paper>
		</Anchor>
	);
}

const SPECTRON_VIDEO_URL = "https://cdn.brandsafe.io/d7eeplmems9s73ft769g.mp4";

function ContextsOnboardingModal({
	deployHref,
	canDeploy,
}: {
	deployHref: string;
	canDeploy: boolean;
}) {
	const [isOpen, openHandle] = useBoolean();
	const [completed, complete] = useOnboarding("cloud-contexts");

	useEffect(() => {
		if (!completed) {
			openHandle.open();
			complete();
		}
	}, [completed]);

	return (
		<Modal
			opened={isOpen}
			onClose={openHandle.close}
			trapFocus={false}
			padding={0}
			size={525}
		>
			<ActionButton
				pos="absolute"
				top={16}
				right={16}
				label="Close"
				onClick={openHandle.close}
				style={{ zIndex: 1 }}
			>
				<Icon path={iconClose} />
			</ActionButton>

			<VideoPlayer
				src={SPECTRON_VIDEO_URL}
				initialMuted={true}
				autoPlay={true}
			/>

			<Divider />

			<Paper
				p={24}
				withBorder={false}
				radius={0}
			>
				<Stack gap="xl">
					<Text
						c="bright"
						fw={500}
						fz="xl"
					>
						Spectron — Agent Memory That Actually Works
					</Text>

					<Text>
						Spectron gives your AI agents persistent, queryable memory powered by
						knowledge graphs, entity extraction, temporal facts, and hybrid retrieval —
						built directly into SurrealDB rather than bolted on top.
					</Text>

					<List
						size="sm"
						spacing="xs"
					>
						<List.Item>
							Automatically extract entities, relationships, and facts from
							conversations
						</List.Item>
						<List.Item>
							Hybrid retrieval combining graph traversal, vector similarity, and
							structured filters
						</List.Item>
						<List.Item>
							Temporal awareness with bi-temporal, append-only facts
						</List.Item>
						<List.Item>Multi-agent shared memory with full ACID transactions</List.Item>
					</List>

					<Group>
						<Link href="https://surrealdb.com/platform/spectron">
							<Button
								color="obsidian"
								variant="light"
								rightSection={<Icon path={iconOpen} />}
							>
								Learn more
							</Button>
						</Link>
						<Spacer />
						{canDeploy && (
							<Link href={deployHref}>
								<Button
									variant="gradient"
									rightSection={<Icon path={iconChevronRight} />}
									onClick={openHandle.close}
								>
									Deploy a context
								</Button>
							</Link>
						)}
					</Group>
				</Stack>
			</Paper>
		</Modal>
	);
}

export function OrganizationContextsTab({ organization }: OrganizationTabProps) {
	const navigateContext = useContextNavigator();
	const allRegions = useCloudStore((s) => s.regions);
	const isAdmin = hasOrganizationRoles(organization, ORG_ROLES_ADMIN);
	const isRestricted = isOrganisationRestricted(organization);

	const [search, setSearch] = useState("");
	const [regionFilter, setRegionFilter] = useState<string | null>(null);

	const {
		data: contextData,
		isSuccess: contextsLoaded,
		isPending: contextsPending,
	} = useCloudOrganizationContextsQuery(organization.id);

	const contexts = contextsLoaded ? contextData : [];

	const regionOptions = useMemo(() => {
		const usedRegions = new Set(contexts.map((c) => c.region));

		return allRegions
			.filter((r) => usedRegions.has(r.slug))
			.map((r) => ({ label: r.description, value: r.slug }));
	}, [allRegions, contexts]);

	const filteredContexts = useMemo(() => {
		return contexts
			.filter((context) => {
				if (search && !context.name.toLowerCase().includes(search.toLowerCase())) {
					return false;
				}

				if (regionFilter && context.region !== regionFilter) {
					return false;
				}

				return true;
			})
			.sort((a, b) => a.name.localeCompare(b.name));
	}, [contexts, search, regionFilter]);

	const deployHref = `/o/${organization.id}/contexts/deploy`;

	return (
		<>
			<ContextsOnboardingModal
				deployHref={deployHref}
				canDeploy={isAdmin && !isRestricted}
			/>

			<Group
				justify="space-between"
				align="flex-end"
			>
				<PrimaryTitle fz={32}>Contexts</PrimaryTitle>
				{isAdmin && (
					<Link href={deployHref}>
						<Button
							size="xs"
							disabled={isRestricted}
							variant="gradient"
						>
							Create context
						</Button>
					</Link>
				)}
			</Group>

			<Group mt="lg">
				<TextInput
					placeholder="Search contexts..."
					leftSection={<Icon path={iconSearch} />}
					value={search}
					onChange={(e) => setSearch(e.currentTarget.value)}
					style={{ flex: 1 }}
				/>
				{regionOptions.length > 1 && (
					<Select
						placeholder="All regions"
						data={regionOptions}
						value={regionFilter}
						onChange={setRegionFilter}
						clearable
						w={220}
					/>
				)}
			</Group>

			<SimpleGrid
				cols={GRID_COLUMNS}
				mt="lg"
			>
				{contextsPending && <Skeleton h={112} />}
				{filteredContexts.map((ctx) => (
					<ContextCard
						key={ctx.id}
						context={ctx}
						regions={allRegions}
						onClick={() => navigateContext(ctx.id)}
					/>
				))}
			</SimpleGrid>

			{contextsLoaded && contexts.length === 0 && (
				<Box
					ta="center"
					py={64}
				>
					<Stack
						align="center"
						gap="sm"
					>
						<Text
							c="bright"
							fw={600}
							fz="xl"
						>
							No contexts deployed yet
						</Text>
						<Text
							fz="sm"
							maw={360}
						>
							Create your first Spectron context to add persistent memory and
							knowledge to your AI applications.
						</Text>
						{isAdmin && (
							<Link href={deployHref}>
								<Button
									mt="xs"
									disabled={isRestricted}
									variant="gradient"
								>
									Create context
								</Button>
							</Link>
						)}
					</Stack>
				</Box>
			)}

			{contextsLoaded &&
				contexts.length > 0 &&
				filteredContexts.length === 0 &&
				(search || regionFilter) && (
					<Box
						ta="center"
						py={48}
					>
						<Text
							c="bright"
							fw={600}
						>
							No matching contexts
						</Text>
						<Text fz="sm">Try adjusting your search or filter</Text>
					</Box>
				)}
		</>
	);
}
