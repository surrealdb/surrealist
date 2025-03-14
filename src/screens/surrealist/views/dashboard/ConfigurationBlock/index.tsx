import { BoxProps, Button, Skeleton, ThemeIcon } from "@mantine/core";
import { Group, Paper, Stack, Text } from "@mantine/core";
import { ReactNode } from "react";
import { Icon } from "~/components/Icon";
import { useCloudStore } from "~/stores/cloud";
import { CloudInstance } from "~/types";
import { formatMemory, plural } from "~/util/helpers";
import {
	iconChevronRight,
	iconDatabase,
	iconHistory,
	iconMarker,
	iconMemory,
	iconTag,
} from "~/util/icons";

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
	const typeText = `${typeName} (${typeCategory})`;
	const storageText = formatMemory(storageSize * 1024);

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

						<Button
							size="xs"
							color="slate"
							rightSection={<Icon path={iconChevronRight} />}
							onClick={onConfigure}
							disabled={!instance}
							my={-2}
						>
							Configure instance
						</Button>
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
