import { BoxProps, Button, ThemeIcon } from "@mantine/core";
import { Paper, Group, Text, Stack } from "@mantine/core";
import { ReactNode } from "react";
import { Icon } from "~/components/Icon";
import { useCloudStore } from "~/stores/cloud";
import { CloudInstance } from "~/types";
import {
	iconChevronRight,
	iconDatabase,
	iconMarker,
	iconMemory,
	iconQuery,
	iconTag,
} from "~/util/icons";
import { ConfigurationDrawer } from "./drawer";
import { useBoolean } from "~/hooks/boolean";
import { plural } from "~/util/helpers";

export interface ConfigurationBlockProps {
	instance: CloudInstance | undefined;
	onUpdate: (version: string) => void;
}

export function ConfigurationBlock({ instance, onUpdate }: ConfigurationBlockProps) {
	const [editing, editingHandle] = useBoolean();

	const regions = useCloudStore((s) => s.regions);
	const region = instance?.region;
	const regionName = regions.find((r) => r.slug === region)?.description ?? region;

	const computeUnits = instance?.compute_units ?? 0;
	const computeText = `${computeUnits} ${plural(computeUnits, "unit")}`;

	return (
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
					value={instance?.type.display_name}
				/>

				<ConfigValue
					title="Compute"
					icon={iconQuery}
					value={computeText}
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
						value="8.0 GB"
						flex={1}
					/>

					<Button
						variant="light"
						color="slate"
						rightSection={<Icon path={iconChevronRight} />}
						onClick={editingHandle.open}
						disabled={!instance}
						my={-2}
					>
						Configure
					</Button>
				</Group>
			</Stack>

			{instance && (
				<ConfigurationDrawer
					opened={editing}
					instance={instance}
					onClose={editingHandle.close}
					onUpdate={onUpdate}
				/>
			)}
		</Paper>
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
				<Icon
					path={icon}
					size={1.1}
					c="slate"
				/>
			</ThemeIcon>
			<Group gap="xs">
				<Text fw={600}>{title}: </Text>
				<Text c="bright">{value}</Text>
			</Group>
		</Group>
	);
}
