import {
	iconChevronRight,
	iconCloud,
	iconDatabase,
	iconHistory,
	iconMarker,
	iconMemory,
	iconQuery,
	iconTag,
} from "~/util/icons";

import { BoxProps, Button, SimpleGrid, Skeleton, ThemeIcon } from "@mantine/core";
import { Group, Paper, Stack, Text } from "@mantine/core";
import { ReactNode } from "react";
import { useHasOrganizationRole } from "~/cloud/hooks/role";
import { Icon } from "~/components/Icon";
import { useCloudStore } from "~/stores/cloud";
import { CloudInstance } from "~/types";
import { getTypeCategoryName } from "~/util/cloud";
import { formatMemory, plural } from "~/util/helpers";
import { Spacer } from "~/components/Spacer";

export interface ConfigurationBlockProps {
	instance: CloudInstance | undefined;
	isLoading: boolean;
	onUpgrade: () => void;
	onConfigure: () => void;
}

export function ConfigurationBlock({
	instance,
	isLoading,
	onUpgrade,
	onConfigure,
}: ConfigurationBlockProps) {
	const regions = useCloudStore((s) => s.regions);
	const region = instance?.region;
	const regionName = regions.find((r) => r.slug === region)?.description ?? region;

	const storageSize = instance?.storage_size ?? 0;
	const memoryMax = instance?.type.memory ?? 0;
	const computeCores = instance?.type.cpu ?? 0;
	const computeMax = instance?.type.compute_units.max ?? 0;
	const typeName = instance?.type.display_name ?? "";
	const typeCategory = instance?.type.category ?? "";

	const isFree = instance?.type.category === "free";
	const backupText = isFree ? "Upgrade Required" : "Enabled";
	const typeText = `${typeName} (${getTypeCategoryName(typeCategory)})`;
	const computeText = `${computeMax} vCPU${plural(computeMax, "", "s")} (${computeCores} ${plural(computeCores, "Core", "Cores")})`;
	const storageText = formatMemory(storageSize * 1000, true);

	const isIdle = instance?.state !== "ready" && instance?.state !== "paused";
	const canModify = useHasOrganizationRole(instance?.organization_id ?? "", "admin");

	return (
		<Skeleton
			visible={isLoading}
			display="grid"
		>
			<Paper p="xl">
				<SimpleGrid cols={2}>
					<Stack gap="sm">
						<ConfigValue
							title="Type"
							icon={iconCloud}
							value={typeText}
						/>

						<ConfigValue
							title="Region"
							icon={iconMarker}
							value={regionName}
						/>

						<ConfigValue
							title="Version"
							icon={iconTag}
							value={`SurrealDB ${instance?.version}`}
						/>
						<ConfigValue
							title="Backups"
							icon={iconHistory}
							value={<Text c={isFree ? "dimmed" : "bright"}>{backupText}</Text>}
						/>
					</Stack>
					<Stack gap="sm">
						<ConfigValue
							title="Memory"
							icon={iconMemory}
							value={formatMemory(memoryMax)}
						/>

						<ConfigValue
							title="Compute"
							icon={iconQuery}
							value={computeText}
						/>
						<ConfigValue
							title="Storage"
							icon={iconDatabase}
							value={storageText}
						/>
					</Stack>
				</SimpleGrid>
				{canModify && (
					<Group pt="lg">
						<Button
							size="xs"
							color="slate"
							onClick={onConfigure}
							disabled={!instance || isIdle}
							variant="light"
							my={-2}
						>
							Configure
						</Button>
						<Spacer />
						<Button
							size="xs"
							onClick={onUpgrade}
							disabled={!instance || isIdle}
							variant="gradient"
							my={-2}
						>
							Upgrade
						</Button>
					</Group>
				)}
			</Paper>
		</Skeleton>
	);
}

interface ConfigValueProps extends BoxProps {
	title: string;
	icon: string;
	value: ReactNode;
}

function ConfigValue({ title, icon, value, ...other }: ConfigValueProps) {
	return (
		<Group
			gap="sm"
			h={32}
			{...other}
		>
			<ThemeIcon
				color="slate"
				radius="xs"
				variant="light"
			>
				<Icon path={icon} />
			</ThemeIcon>
			<Group gap="xs">
				<Text fw={600}>{title}: </Text>
				<Text c="bright">{value}</Text>
			</Group>
		</Group>
	);
}
