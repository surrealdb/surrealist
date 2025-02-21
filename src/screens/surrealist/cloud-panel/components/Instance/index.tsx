import classes from "./style.module.scss";

import {
	ActionIcon,
	Alert,
	Badge,
	Box,
	Button,
	Group,
	Indicator,
	type MantineColor,
	Menu,
	Paper,
	Stack,
	Table,
	Text,
	Tooltip,
} from "@mantine/core";

import {
	iconAPI,
	iconArrowUpRight,
	iconChevronDown,
	iconCloudClock,
	iconConsole,
	iconCopy,
	iconDelete,
	iconDotsVertical,
	iconMarker,
	iconMemory,
	iconPower,
	iconQuery,
	iconServer,
	iconTag,
	iconTransfer,
	iconTune,
	iconUpload,
} from "~/util/icons";

import { useQueryClient } from "@tanstack/react-query";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { useConfirmation } from "~/providers/Confirmation";
import { useCloudStore } from "~/stores/cloud";
import type { CloudInstance, InstanceState } from "~/types";
import { showError, showInfo } from "~/util/helpers";
import { fetchAPI } from "../../api";
import { openCapabilitiesModal } from "./modals/capabilities";
import { openInstanceTypeModal } from "./modals/change-type";
import { openComputeUnitsModal } from "./modals/change-units";
import { openVersionUpgradeModal } from "./modals/upgrade-version";
import { openUsageModal } from "./modals/view-usage";

export type ConnectMethod = "sdk" | "cli" | "curl" | "surrealist";

const CATEGORY_NAMES: Record<string, string> = {
	production: "Production",
	development: "Development",
	free: "Free instance",
};

const BADGE_INFO = {
	creating: ["blue", "Creating"],
	updating: ["blue", "Updating"],
	deleting: ["red", "Deleting"],
	inactive: ["red.4", "Inactive"],
} satisfies Partial<Record<InstanceState, [MantineColor, string]>>;

interface StateBadgeProps {
	state: InstanceState;
	small?: boolean;
}

function StateBadge({ state, small }: StateBadgeProps) {
	if (state === "ready") {
		return (
			<Tooltip label="Instance is active and utilizing resources">
				<Indicator
					processing
					color="green"
					ml="xs"
				/>
			</Tooltip>
		);
	}

	const [color, text] = BADGE_INFO[state];

	return (
		<Badge
			color={color}
			variant="light"
			size={small ? "sm" : "md"}
		>
			{text}
		</Badge>
	);
}

export interface Instance {
	type: "card" | "row";
	value: CloudInstance;
	onDelete: () => void;
	onConnect: (method: ConnectMethod, db: CloudInstance) => void;
}

export function Instance({ type, value, onDelete, onConnect }: Instance) {
	const inactive = value.state === "inactive";
	const regions = useCloudStore((s) => s.regions);
	const categoryName = CATEGORY_NAMES[value.type.category];
	const regionName = regions.find((r) => r.slug === value.region)?.description ?? value.region;
	const client = useQueryClient();

	const handleDelete = useConfirmation({
		message: (
			<Stack>
				<Text>
					You are about to delete this instance. This will cause all associated resources
					to be destroyed.
				</Text>
				<Alert
					title="Important"
					color="red"
				>
					Data stored within this instance will be permanently deleted and cannot be
					recovered.
				</Alert>
			</Stack>
		),
		confirmText: "Delete",
		title: `Delete ${value.name}`,
		verification: value.name,
		verifyText: "Type the instance name to confirm",
		onConfirm: async () => {
			try {
				await fetchAPI(`/instances/${value.id}`, {
					method: "DELETE",
				});

				showInfo({
					title: "Deleting instance",
					subtitle: (
						<>
							<Text
								span
								c="bright"
							>
								{value.name}
							</Text>{" "}
							is being deleted
						</>
					),
				});

				client.invalidateQueries({
					queryKey: ["cloud", "instances"],
				});
			} catch (err: any) {
				showError({
					title: "Failed to delete instance",
					subtitle: err.message,
				});
			} finally {
				onDelete();
			}
		},
	});

	const actionList = (
		<Menu position="right-start">
			<Menu.Target>
				<ActionIcon disabled={value.state !== "ready"}>
					<Icon path={iconDotsVertical} />
				</ActionIcon>
			</Menu.Target>
			<Menu.Dropdown>
				<Menu.Label>Configure</Menu.Label>
				{/* <Menu.Item
					onClick={() => {}}
					leftSection={<Icon path={iconText} />}
					disabled
				>
					Rename instance...
				</Menu.Item> */}
				<Menu.Item
					onClick={() => openInstanceTypeModal(value)}
					leftSection={<Icon path={iconMemory} />}
				>
					Instance type
				</Menu.Item>
				<Menu.Item
					onClick={() => openComputeUnitsModal(value)}
					leftSection={<Icon path={iconQuery} />}
				>
					Compute nodes
				</Menu.Item>
				<Menu.Item
					onClick={() => openCapabilitiesModal(value)}
					leftSection={<Icon path={iconTune} />}
				>
					Capabilities
				</Menu.Item>
				<Menu.Label mt="sm">Actions</Menu.Label>
				<Menu.Item
					leftSection={<Icon path={iconArrowUpRight} />}
					onClick={() => openVersionUpgradeModal(value)}
					disabled={value.available_versions.length === 0}
				>
					Update SurrealDB
				</Menu.Item>
				<Menu.Item
					leftSection={<Icon path={iconTransfer} />}
					onClick={() => openUsageModal(value)}
				>
					View instance usage
				</Menu.Item>
				<Menu.Item
					leftSection={<Icon path={iconCopy} />}
					onClick={() => {
						navigator.clipboard.writeText(`${value.host}`).then(() => {
							showInfo({
								title: "Success",
								subtitle: "Successfully copied the hostname",
							});
						});
					}}
				>
					Copy hostname
				</Menu.Item>
				<Menu.Label mt="sm">Dangerous</Menu.Label>
				<Menu.Item
					onClick={handleDelete}
					leftSection={
						<Icon
							path={iconDelete}
							c="red"
						/>
					}
					c="red"
				>
					Delete instance
				</Menu.Item>
			</Menu.Dropdown>
		</Menu>
	);

	const connectionList = (
		<Menu
			position="bottom-start"
			transitionProps={{
				transition: "scale-y",
			}}
		>
			<Menu.Target>
				<Button
					size="xs"
					radius="sm"
					color="slate"
					variant="light"
					rightSection={<Icon path={iconChevronDown} />}
					disabled={value.state !== "ready"}
				>
					Connect
				</Button>
			</Menu.Target>
			<Menu.Dropdown>
				<Menu.Item
					leftSection={<Icon path={iconServer} />}
					onClick={() => onConnect("surrealist", value)}
				>
					Open in Surrealist
				</Menu.Item>
				<Menu.Divider />
				<Menu.Item
					leftSection={<Icon path={iconConsole} />}
					onClick={() => onConnect("cli", value)}
				>
					Surreal CLI
				</Menu.Item>
				<Menu.Item
					leftSection={<Icon path={iconAPI} />}
					onClick={() => onConnect("sdk", value)}
				>
					Client SDK
				</Menu.Item>
				<Menu.Item
					leftSection={<Icon path={iconTransfer} />}
					onClick={() => onConnect("curl", value)}
				>
					HTTP cURL
				</Menu.Item>
			</Menu.Dropdown>
		</Menu>
	);

	return type === "card" ? (
		<Paper
			p="xl"
			shadow="md"
			component={Stack}
			className={classes.root}
			gap="sm"
		>
			<Group
				align="start"
				mb="sm"
			>
				<Box>
					<Group>
						<Text
							c="bright"
							fw={600}
							fz="xl"
						>
							{value.name}
						</Text>
						<StateBadge state={value.state} />
					</Group>
					<Text
						mt={2}
						fz="sm"
						style={{ userSelect: "text" }}
					>
						ID: {value.id}
					</Text>
				</Box>
				<Spacer />
				{actionList}
			</Group>
			<Group
				title="Instance Preset"
				gap="sm"
				h={32}
			>
				<Icon
					path={iconMemory}
					size="lg"
					c="slate"
				/>
				<Group gap="xs">
					<Text c="bright">{value.type.display_name}</Text>
					{categoryName && <Text>({categoryName})</Text>}
				</Group>
			</Group>
			<Group
				title="Region"
				gap="sm"
				h={32}
			>
				<Icon
					path={iconMarker}
					size="lg"
					c="slate"
				/>
				<Text c="bright">{regionName}</Text>
			</Group>
			<Group>
				<Group
					title="Version"
					gap="sm"
					h={32}
				>
					<Icon
						path={iconTag}
						size="lg"
						c="slate"
					/>
					<Text c="bright">SurrealDB {value.version}</Text>
				</Group>
				<Spacer />
				{inactive ? (
					<Button
						size="xs"
						color="slate"
						radius="sm"
						rightSection={<Icon path={iconPower} />}
						disabled
					>
						Enable database
					</Button>
				) : (
					connectionList
				)}
			</Group>
		</Paper>
	) : (
		<Table.Tr key={value.id}>
			<Table.Td>
				<Group wrap="nowrap">
					<Text
						c="bright"
						fw={500}
					>
						{value.name}
					</Text>
					<StateBadge
						state={value.state}
						small
					/>
				</Group>
			</Table.Td>
			<Table.Td>
				<Group gap="xs">
					<Text c="bright">{value.type.display_name}</Text>
					{categoryName && <Text>({categoryName})</Text>}
				</Group>
			</Table.Td>
			<Table.Td>
				<Text c="bright">{regionName}</Text>
			</Table.Td>
			<Table.Td>
				<Text c="bright">SurrealDB {value.version}</Text>
			</Table.Td>
			<Table.Td>
				<Group wrap="nowrap">
					{actionList}
					{connectionList}
				</Group>
			</Table.Td>
		</Table.Tr>
	);
}
