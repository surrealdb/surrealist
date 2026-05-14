import {
	ActionIcon,
	Anchor,
	Box,
	Button,
	Group,
	Paper,
	Select,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	TextInput,
	ThemeIcon,
} from "@mantine/core";
import { Icon, iconDotsVertical, iconSearch, iconSpectron, Spacer } from "@surrealdb/ui";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { hasOrganizationRoles, isOrganisationRestricted, ORG_ROLES_ADMIN } from "~/cloud/helpers";
import { useCloudOrganizationContextsQuery } from "~/cloud/queries/contexts";
import { ContextActions } from "~/components/ContextActions";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useContextNavigator } from "~/hooks/routing";
import { ContextsOnboarding } from "~/modals/onboarding";
import { useCloudStore } from "~/stores/cloud";
import type { CloudContext, CloudOrganization } from "~/types";
import { ON_STOP_PROPAGATION } from "~/util/helpers";
import type { OrganizationTabProps } from "../types";

const GRID_COLUMNS = {
	xs: 1,
	sm: 2,
	lg: 3,
};

function ContextCard({
	context,
	organization,
	regions,
	onClick,
}: {
	context: CloudContext;
	organization: CloudOrganization;
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
					<Group gap="lg">
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
							className="selectable"
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

					<Spacer />

					{/* biome-ignore lint/a11y/noStaticElementInteractions: Stop event propagation */}
					<div
						onClick={ON_STOP_PROPAGATION}
						onKeyDown={ON_STOP_PROPAGATION}
					>
						<ContextActions
							context={context}
							organisation={organization}
						>
							<ActionIcon
								color="slate"
								variant="subtle"
								component="div"
							>
								<Icon path={iconDotsVertical} />
							</ActionIcon>
						</ContextActions>
					</div>
				</Group>
			</Paper>
		</Anchor>
	);
}

export function OrganizationContextsTab({ organization }: OrganizationTabProps) {
	const navigateContext = useContextNavigator();
	const allRegions = useCloudStore((s) => s.contextRegions);
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

	const deployPath = `/o/${organization.id}/contexts/deploy`;
	const deployHref = isAdmin && !isRestricted && contexts.length === 0 ? deployPath : undefined;

	return (
		<>
			<ContextsOnboarding deployHref={deployHref} />

			<Group
				justify="space-between"
				align="flex-end"
			>
				<PrimaryTitle fz={32}>Contexts</PrimaryTitle>
				{isAdmin && (
					<Link href={deployPath}>
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
						organization={organization}
						regions={allRegions}
						onClick={() => navigateContext(organization.id, ctx.id)}
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
							className="selectable"
						>
							Create your first Spectron context to add persistent memory and
							knowledge to your AI applications.
						</Text>
						{isAdmin && (
							<Link href={deployPath}>
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
