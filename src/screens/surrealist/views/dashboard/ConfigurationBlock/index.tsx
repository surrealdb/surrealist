import { Button, Image, ThemeIcon, Tooltip } from "@mantine/core";
import { Paper, Group, Divider, Text, Stack } from "@mantine/core";
import { capitalize } from "radash";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { REGION_FLAGS } from "~/constants";
import { useCloudStore } from "~/stores/cloud";
import { CloudInstance } from "~/types";
import {
	iconCog,
	iconDatabase,
	iconEdit,
	iconMarker,
	iconMemory,
	iconTag,
	iconTune,
} from "~/util/icons";

export interface ConfigurationBlockProps {
	instance: CloudInstance | undefined;
}

export function ConfigurationBlock({ instance }: ConfigurationBlockProps) {
	const categoryName = instance ? capitalize(instance.type.category) : "";

	const regions = useCloudStore((s) => s.regions);
	const region = instance?.region;
	const regionName = regions.find((r) => r.slug === region)?.description ?? region;

	return (
		<Paper
			p="xl"
			// h={232}
		>
			<Group>
				<Icon
					path={iconTune}
					size="xl"
				/>
				<Text
					fz="xl"
					fw={600}
					c="bright"
				>
					Configuration
				</Text>
				<Spacer />
				<Button
					color="slate"
					variant="light"
					loading={false}
				>
					Edit
				</Button>
			</Group>
			<Divider my="md" />
			<Stack gap="xs">
				<Group
					title="Region"
					gap="sm"
					h={32}
				>
					<ThemeIcon
						color="slate"
						radius="xs"
					>
						<Icon
							path={iconMarker}
							size="lg"
							c="slate"
						/>
					</ThemeIcon>
					<Text fw={600}>Region: </Text>
					<Text c="bright">{regionName}</Text>
					<Image
						src={REGION_FLAGS[instance?.region ?? ""]}
						w={18}
					/>
				</Group>
				<Group
					title="Instance Preset"
					gap="sm"
					h={32}
				>
					<ThemeIcon
						color="slate"
						radius="xs"
					>
						<Icon
							path={iconMemory}
							size="lg"
							c="slate"
						/>
					</ThemeIcon>
					<Group gap="xs">
						<Text fw={600}>Instance type: </Text>
						<Text c="bright">
							{instance?.type.display_name} {`(${categoryName})`}
						</Text>
					</Group>
				</Group>
				<Group>
					<Group
						title="Version"
						gap="sm"
						h={32}
					>
						<ThemeIcon
							color="slate"
							radius="xs"
						>
							<Icon
								path={iconTag}
								size="lg"
								c="slate"
							/>
						</ThemeIcon>
						<Text fw={600}>Version: </Text>
						<Text c="bright">SurrealDB {instance?.version}</Text>
					</Group>
				</Group>
				<Group>
					<Group
						title="Storage"
						gap="sm"
						h={32}
					>
						<ThemeIcon
							color="slate"
							radius="xs"
						>
							<Icon
								path={iconDatabase}
								size="lg"
								c="slate"
							/>
						</ThemeIcon>
						<Text fw={600}>Disk size: </Text>
						<Text c="bright">8.0 GB</Text>
					</Group>
				</Group>
			</Stack>
		</Paper>
	);
}
