import {
	iconArrowDownFat,
	iconDatabase,
	iconHistory,
	iconMarker,
	iconMemory,
	iconPackageClosed,
	iconQuery,
	iconRelation,
	iconTag,
} from "~/util/icons";

import { BoxProps, Button, SimpleGrid, Skeleton, ThemeIcon } from "@mantine/core";
import { Group, Paper, Stack, Text } from "@mantine/core";
import { ReactNode } from "react";
import { useHasOrganizationRole } from "~/cloud/hooks/role";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import { CloudInstance } from "~/types";
import { tagEvent } from "~/util/analytics";
import { getTypeCategoryName } from "~/util/cloud";
import { formatMemory, plural } from "~/util/helpers";
import { PropertyValue } from "~/components/PropertyValue";

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
	const cpuCount = instance?.type.cpu ?? 0;
	const typeName = instance?.type.display_name ?? "";
	const typeCategory = instance?.type.category ?? "";
	const nodeCount = instance?.compute_units ?? 0;

	const isFree = instance?.type.category === "free";
	const backupText = isFree ? "Upgrade required" : "Active";
	const typeText = isFree ? "Free" : `${typeName} (${getTypeCategoryName(typeCategory)})`;
	const computeText = `${cpuCount} ${plural(cpuCount, "vCPU")}`;
	const storageText = formatMemory(storageSize * 1000, true);
	const nodeText = nodeCount === 1 ? "Single node" : `${nodeCount} Node`;

	const isIdle = instance?.state !== "ready" && instance?.state !== "paused";
	const canModify = useHasOrganizationRole(instance?.organization_id ?? "", "admin");

	const handleUpgrade = useStable(() => {
		onUpgrade();
		tagEvent("cloud_instance_upgrade_click");
	});

	return (
		<Skeleton
			visible={isLoading}
			display="grid"
		>
			<Paper p="xl">
				<SimpleGrid
					cols={{ base: 1, xl: 2 }}
					spacing="xs"
				>
					<Stack gap="xs">
						<PropertyValue
							title="Type"
							icon={iconPackageClosed}
							value={typeText}
						/>

						<PropertyValue
							title="Region"
							icon={iconMarker}
							value={regionName}
						/>

						<PropertyValue
							title="Version"
							icon={iconTag}
							value={`SurrealDB ${instance?.version}`}
						/>
						<PropertyValue
							title="Backups"
							icon={iconHistory}
							value={<Text c={isFree ? "orange" : "green"}>{backupText}</Text>}
						/>
					</Stack>
					<Stack gap="xs">
						<PropertyValue
							title="Memory"
							icon={iconMemory}
							value={formatMemory(memoryMax)}
						/>

						<PropertyValue
							title="Compute"
							icon={iconQuery}
							value={computeText}
						/>

						<PropertyValue
							title="Nodes"
							icon={iconRelation}
							value={nodeText}
						/>

						<PropertyValue
							title="Storage limit"
							icon={iconDatabase}
							value={storageText}
						/>
					</Stack>
				</SimpleGrid>
				<SimpleGrid
					mt="xl"
					cols={2}
				>
					<Button
						size="xs"
						color="slate"
						onClick={onConfigure}
						disabled={!instance || isIdle || !canModify}
						variant="light"
						my={-2}
						fullWidth
					>
						Configure instance
					</Button>
					<Button
						size="xs"
						onClick={onUpgrade}
						disabled={!instance || isIdle || !canModify}
						variant="gradient"
						my={-2}
						fullWidth
						rightSection={
							<Icon
								style={{ rotate: "180deg" }}
								path={iconArrowDownFat}
								size="sm"
							/>
						}
					>
						Upgrade now
					</Button>
				</SimpleGrid>
			</Paper>
		</Skeleton>
	);
}
