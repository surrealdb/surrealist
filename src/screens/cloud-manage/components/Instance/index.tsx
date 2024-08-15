import classes from "./style.module.scss";
import { Paper, Stack, Group, Menu, ActionIcon, Text, Badge, ThemeIcon, Button, Table, MantineColor } from "@mantine/core";
import { iconDotsVertical, iconMarker, iconChevronDown, iconAPI, iconConsole, iconSurreal } from "~/util/icons";
import { mdiMemory, mdiPower } from "@mdi/js";
import { Spacer } from "~/components/Spacer";
import { Icon } from "~/components/Icon";
import { PropsWithChildren } from "react";
import { CloudInstance, InstanceState } from "~/types";
import { fetchAPI } from "../../api";
import { showError, showInfo } from "~/util/helpers";
import { useConfirmation } from "~/providers/Confirmation";
import { useCloudStore } from "~/stores/cloud";

export type ConnectMethod = "sdk" | "cli" | "surrealist";

const BADGE_INFO = {
	creating: ["blue", "Creating"],
	updating: ["blue", "Updating"],
	deleting: ["red", "Deleting"],
	inactive: ["red.4", "Inactive"]
} satisfies Partial<Record<InstanceState, [MantineColor, string]>>;

interface StateBadgeProps {
	state: InstanceState;
	small?: boolean;
}

function StateBadge({
	state,
	small
}: StateBadgeProps) {
	if (state === "ready") {
		return;
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

interface Info {
	db: CloudInstance;
	icon: string;
}

function Info({
	db,
	icon,
	children
}: PropsWithChildren<Info>) {
	return (
		<Group gap="sm">
			<ThemeIcon
				color={db.state === "inactive" ? "slate" : "pink"}
				variant="light"
			>
				<Icon path={icon} c={db.state === "inactive" ? "slate.2" : "pink.2"} />
			</ThemeIcon>
			{children}
		</Group>
	);
}

export interface Instance {
	type: "card" | "row";
	value: CloudInstance;
	onDelete: () => void;
	onConnect: (method: ConnectMethod, db: CloudInstance) => void;
	onOpenSettings: (db: CloudInstance) => void;
}

export function Instance({
	type,
	value,
	onDelete,
	onConnect,
	onOpenSettings,
}: Instance) {
	const inactive = value.state === "inactive";
	const regions = useCloudStore(s => s.regions);
	const regionName = regions.find(r => r.slug === value.region)?.description ?? value.region;

	const handleDelete = useConfirmation({
		message: "You are about to delete this instance. This will cause all associated resources to be destroyed",
		confirmText: "Delete",
		title: "Delete instance",
		onConfirm: async () => {
			try {
				await fetchAPI(`/instances/${value.id}`, {
					method: "DELETE"
				});

				showInfo({
					title: "Instance deleted",
					subtitle: (
						<>
							<Text span c="bright">{value.name}</Text> has been deleted
						</>
					)
				});
			} catch (err: any) {
				showError({
					title: "Failed to delete instance",
					subtitle: err.message
				});
			} finally {
				onDelete();
			}
		},
	});

	const actionList = (
		<Menu position="right-start">
			<Menu.Target>
				<ActionIcon
					disabled={value.state !== "ready"}
				>
					<Icon path={iconDotsVertical} />
				</ActionIcon>
			</Menu.Target>
			<Menu.Dropdown>
				<Menu.Item
					onClick={() => onOpenSettings(value)}
				>
					Settings...
				</Menu.Item>
				<Menu.Divider />
				{/* <Menu.Item
					onClick={handleDeactivate}
				>
					{inactive ? "Activate" : "Deactivate"} instance
				</Menu.Item> */}
				<Menu.Item
					onClick={handleDelete}
					color="red"
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
				transition: "scale-y"
			}}
		>
			<Menu.Target>
				<Button
					size="xs"
					color="slate"
					radius="sm"
					rightSection={<Icon path={iconChevronDown} />}
					disabled={value.state !== "ready"}
				>
					Connect
				</Button>
			</Menu.Target>
			<Menu.Dropdown>
				<Menu.Item
					onClick={() => onConnect("surrealist", value)}
				>
					Open in Surrealist...
				</Menu.Item>
				<Menu.Divider />
				<Menu.Item
					leftSection={<Icon path={iconConsole} />}
					onClick={() => onConnect("cli", value)}
				>
					Command-line
				</Menu.Item>
				<Menu.Item
					leftSection={<Icon path={iconAPI} />}
					onClick={() => onConnect("sdk", value)}
				>
					Client SDK
				</Menu.Item>
			</Menu.Dropdown>
		</Menu>
	);

	return type === "card" ? (
		<Paper
			p="xl"
			bg="slate.8"
			shadow="md"
			component={Stack}
			className={classes.root}
		>
			<Group>
				<Text c="bright" fw={600} fz="xl">
					{value.name}
				</Text>
				<StateBadge state={value.state} />
				<Spacer />
				{actionList}
			</Group>
			<Info
				db={value}
				icon={mdiMemory}
			>
				{value.type.slug}
			</Info>
			<Info
				db={value}
				icon={iconMarker}
			>
				{regionName}
			</Info>
			<Group>
				<Info
					db={value}
					icon={iconSurreal}
				>
					SurrealDB {value.version}
				</Info>
				<Spacer />
				{inactive ? (
					<Button
						size="xs"
						color="slate"
						radius="sm"
						rightSection={<Icon path={mdiPower} />}
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
					<Text c="bright" fw={500}>
						{value.name}
					</Text>
					<StateBadge state={value.state} small />
				</Group>
			</Table.Td>
			<Table.Td>
				{value.type.slug}
			</Table.Td>
			<Table.Td>
				{regionName}
			</Table.Td>
			<Table.Td>
				SurrealDB 2.0
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
