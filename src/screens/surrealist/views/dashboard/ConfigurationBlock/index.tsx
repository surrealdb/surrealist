import { Button, Paper, SimpleGrid, Skeleton, Stack, Text } from "@mantine/core";
import { useHasOrganizationRole } from "~/cloud/hooks/role";
import { Icon } from "~/components/Icon";
import { PropertyValue } from "~/components/PropertyValue";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import { CloudInstance } from "~/types";
import { tagEvent } from "~/util/analytics";
import { getTypeCategoryName } from "~/util/cloud";
import { formatMemory, plural } from "~/util/helpers";
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
	const nodeText = nodeCount === 1 ? "Single-node" : plural(nodeCount, `${nodeCount} Node`);

	const isIdle = instance?.state !== "ready" && instance?.state !== "paused";
	const canModify = useHasOrganizationRole(instance?.organization_id ?? "", "admin");

	const handleUpgrade = useStable(() => {
		onUpgrade();

		if (instance) {
			tagEvent("cloud_instance_upgrade_click", {
				instance: instance.id,
				region: instance.region,
				version: instance.version,
				instance_type: instance.type.slug,
				storage_size: instance.storage_size,
				organisation: instance.organization_id,
			});
		}
	});

	return (
		<Skeleton
			visible={isLoading}
			display="grid"
		>
			<Paper
				p="xl"
				variant="gradient"
			>
				<SimpleGrid
					cols={{ base: 1, xl: 2 }}
					spacing="xl"
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
					spacing="xl"
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
						onClick={handleUpgrade}
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
