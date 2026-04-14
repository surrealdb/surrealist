import {
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
} from "@mantine/core";
import {
	Icon,
	iconChevronRight,
	iconClose,
	iconOpen,
	iconSearch,
	Spacer,
	VideoPlayer,
} from "@surrealdb/ui";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { hasOrganizationRoles, isOrganisationRestricted, ORG_ROLES_ADMIN } from "~/cloud/helpers";
import { useCloudOrganizationInstancesQuery } from "~/cloud/queries/instances";
import { ActionButton } from "~/components/ActionButton";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useBoolean } from "~/hooks/boolean";
import { useOnboarding } from "~/hooks/onboarding";
import { useConnectionNavigator } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import type { CloudInstance } from "~/types";
import { resolveInstanceConnection } from "~/util/connection";
import { StartInstance } from "../../Overview/content/instance";
import type { OrganizationTabProps } from "../types";

const GRID_COLUMNS = {
	xs: 1,
	sm: 2,
	lg: 3,
};

function statusComparator(a: CloudInstance, b: CloudInstance) {
	if (a.state === "paused" && b.state !== "paused") return 1;
	if (a.state !== "paused" && b.state === "paused") return -1;
	return 0;
}

const SURREALDB_VIDEO_URL = "https://surrealdb.com/videos/surrealdb-overview.mp4";

function InstancesOnboardingModal({
	deployHref,
	canDeploy,
}: {
	deployHref: string;
	canDeploy: boolean;
}) {
	const [isOpen, openHandle] = useBoolean();
	const [completed, complete] = useOnboarding("cloud-instances");

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
				src={SURREALDB_VIDEO_URL}
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
						SurrealDB Cloud — Context, Made Atomic
					</Text>

					<Text>
						SurrealDB is the database that makes context atomic. Documents, graphs,
						vectors, time-series, and relational data as native primitives in a single
						ACID transaction — no plugins, no bolt-ons.
					</Text>

					<List
						size="sm"
						spacing="xs"
					>
						<List.Item>
							Native multi-model engine unifying documents, graphs, vectors, full-text
							search, and time-series
						</List.Item>
						<List.Item>
							Deploy anywhere — from embedded and edge devices to highly scalable
							cloud
						</List.Item>
						<List.Item>
							Built-in real-time subscriptions, event triggers, and streaming updates
						</List.Item>
						<List.Item>
							Enterprise security with RBAC, record-level permissions, and JWT auth
						</List.Item>
					</List>

					<Group>
						<Link href="https://surrealdb.com/platform/surrealdb">
							<Button
								color="obsidian"
								variant="light"
								rightSection={<Icon path={iconOpen} />}
								radius="sm"
								size="xs"
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
									Deploy an instance
								</Button>
							</Link>
						)}
					</Group>
				</Stack>
			</Paper>
		</Modal>
	);
}

export function OrganizationInstancesTab({ organization }: OrganizationTabProps) {
	const navigateConnection = useConnectionNavigator();
	const allRegions = useCloudStore((s) => s.regions);
	const isAdmin = hasOrganizationRoles(organization, ORG_ROLES_ADMIN);
	const isRestricted = isOrganisationRestricted(organization);

	const [search, setSearch] = useState("");
	const [regionFilter, setRegionFilter] = useState<string | null>(null);

	const {
		data: instanceData,
		isSuccess: instancesLoaded,
		isPending: instancesPending,
	} = useCloudOrganizationInstancesQuery(organization.id);

	const instances = instancesLoaded ? instanceData : [];

	const regionOptions = useMemo(() => {
		const usedRegions = new Set(instances.map((i) => i.region));

		return allRegions
			.filter((r) => usedRegions.has(r.slug))
			.map((r) => ({ label: r.description, value: r.slug }));
	}, [allRegions, instances]);

	const filteredInstances = useMemo(() => {
		return instances
			.filter((instance) => {
				if (search && !instance.name.toLowerCase().includes(search.toLowerCase())) {
					return false;
				}

				if (regionFilter && instance.region !== regionFilter) {
					return false;
				}

				return true;
			})
			.sort((a, b) => statusComparator(a, b) || a.name.localeCompare(b.name));
	}, [instances, search, regionFilter]);

	const activateInstance = useStable((instance: CloudInstance) => {
		navigateConnection(resolveInstanceConnection(instance).id);
	});

	const deployHref = `/o/${organization.id}/instances/deploy`;

	return (
		<>
			<InstancesOnboardingModal
				deployHref={deployHref}
				canDeploy={isAdmin && !isRestricted}
			/>

			<Group
				justify="space-between"
				align="flex-end"
			>
				<PrimaryTitle fz={32}>Instances</PrimaryTitle>
				{isAdmin && (
					<Link href={deployHref}>
						<Button
							size="xs"
							disabled={isRestricted}
							variant="gradient"
						>
							Deploy instance
						</Button>
					</Link>
				)}
			</Group>

			<Group mt="lg">
				<TextInput
					placeholder="Search instances..."
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
				{instancesPending && <Skeleton h={112} />}
				{filteredInstances.map((instance) => (
					<StartInstance
						key={instance.id}
						instance={instance}
						regions={allRegions}
						organisation={organization}
						onConnect={activateInstance}
					/>
				))}
			</SimpleGrid>

			{instancesLoaded && instances.length === 0 && (
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
							No instances deployed yet
						</Text>
						<Text
							fz="sm"
							maw={360}
						>
							Deploy your first SurrealDB Cloud instance to start building with a
							fully managed database.
						</Text>
						{isAdmin && (
							<Link href={deployHref}>
								<Button
									mt="xs"
									disabled={isRestricted}
									variant="gradient"
								>
									Deploy instance
								</Button>
							</Link>
						)}
					</Stack>
				</Box>
			)}

			{instancesLoaded &&
				instances.length > 0 &&
				filteredInstances.length === 0 &&
				(search || regionFilter) && (
					<Box
						ta="center"
						py={48}
					>
						<Text
							c="bright"
							fw={600}
						>
							No matching instances
						</Text>
						<Text fz="sm">Try adjusting your search or filter</Text>
					</Box>
				)}
		</>
	);
}
