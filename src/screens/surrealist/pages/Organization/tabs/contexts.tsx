import {
	Anchor,
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
import { Icon, iconSearch, iconSpectron } from "@surrealdb/ui";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { hasOrganizationRoles, isOrganisationRestricted, ORG_ROLES_ADMIN } from "~/cloud/helpers";
import { useCloudOrganizationContextsQuery } from "~/cloud/queries/contexts";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useContextNavigator } from "~/hooks/routing";
import { useCloudStore } from "~/stores/cloud";
import type { CloudContext } from "~/types";
import { StartPlaceholder } from "../../Overview/content/placeholder";
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

	return (
		<>
			<Group
				justify="space-between"
				align="flex-end"
			>
				<PrimaryTitle fz={32}>Contexts</PrimaryTitle>
				{isAdmin && (
					<Link href={`/o/${organization.id}/contexts/deploy`}>
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
				{contextsLoaded && contexts.length === 0 && (
					<StartPlaceholder
						title="No contexts"
						subtitle="This organisation has no contexts"
					/>
				)}
				{contextsLoaded &&
					contexts.length > 0 &&
					filteredContexts.length === 0 &&
					(search || regionFilter) && (
						<StartPlaceholder
							title="No matching contexts"
							subtitle="Try adjusting your search or filter"
						/>
					)}
			</SimpleGrid>
		</>
	);
}
