import {
	iconChevronRight,
	iconDatabase,
	iconHistory,
	iconMarker,
	iconMemory,
	iconTag,
} from "~/util/icons";

import { BoxProps, Button, Skeleton, ThemeIcon } from "@mantine/core";
import { Group, Paper, Stack, Text } from "@mantine/core";
import { ReactNode } from "react";
import { useHasOrganizationRole } from "~/cloud/hooks/role";
import { Icon } from "~/components/Icon";
import { useCloudStore } from "~/stores/cloud";
import { CloudInstance } from "~/types";
import { getTypeCategoryName } from "~/util/cloud";
import { formatMemory } from "~/util/helpers";

export interface ConfigurationBlockProps {
	instance: CloudInstance | undefined;
	isLoading: boolean;
	onConfigure: () => void;
}

export function ConfigurationBlock({ instance, isLoading, onConfigure }: ConfigurationBlockProps) {
	const regions = useCloudStore((s) => s.regions);
	const region = instance?.region;
	const regionName = regions.find((r) => r.slug === region)?.description ?? region;

	const storageSize = instance?.storage_size ?? 0;
	const typeName = instance?.type.display_name ?? "";
	const typeCategory = instance?.type.category ?? "";

	const backupText = instance?.type.category === "free" ? "Disabled" : "Enabled";
	const typeText = `${typeName} (${getTypeCategoryName(typeCategory)})`;
	const storageText = formatMemory(storageSize * 1000, true);

	const isIdle = instance?.state !== "ready" && instance?.state !== "paused";
	const canModify = useHasOrganizationRole(instance?.organization_id ?? "", "admin");

	return (
		<Skeleton
			visible={isLoading}
			display="grid"
		>
			<Paper p="xl">
				<Stack gap="sm">
					<ConfigValue
						title="Region"
						icon={iconMarker}
						value={regionName}
					/>

					<ConfigValue
						title="Type"
						icon={iconMemory}
						value={typeText}
					/>

					<ConfigValue
						title="Backups"
						icon={iconHistory}
						value={backupText}
					/>

					<ConfigValue
						title="Version"
						icon={iconTag}
						value={`SurrealDB ${instance?.version}`}
					/>

					<Group>
						<ConfigValue
							title="Storage"
							icon={iconDatabase}
							value={storageText}
							flex={1}
						/>

						{canModify && (
							<Button
								size="xs"
								color="slate"
								rightSection={<Icon path={iconChevronRight} />}
								onClick={onConfigure}
								disabled={!instance || isIdle}
								variant="light"
								my={-2}
							>
								Configure instance
							</Button>
						)}
					</Group>
				</Stack>
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
