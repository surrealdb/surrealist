import cloudImg from "~/assets/images/cloud-icon.webp";
import classes from "../style.module.scss";

import {
	Box,
	Divider,
	Group,
	Image,
	Modal,
	ScrollArea,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";

import { iconCloud, iconServer } from "~/util/icons";

import clsx from "clsx";
import { useMemo, useState } from "react";
import { Entry, type EntryProps } from "~/components/Entry";
import { Icon } from "~/components/Icon";
import { useBoolean } from "~/hooks/boolean";
import { useConnectionList, useConnectionOverview } from "~/hooks/connection";
import { useKeyNavigation } from "~/hooks/keys";
import { useConnectionAndView, useConnectionNavigator, useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import type { CloudInstance, Connection } from "~/types";
import { resolveInstanceConnection } from "~/util/connection";
import { Y_SLIDE_TRANSITION } from "~/util/helpers";
import { USER_ICONS } from "~/util/user-icons";

export function ConnectionsModal() {
	const [isOpen, openedHandle] = useBoolean();

	const [search, setSearch] = useState("");
	const [label, setLabel] = useState("");
	const [connection] = useConnectionAndView();
	const navigateConnection = useConnectionNavigator();

	const { sandbox, isEmpty, userConnections, organizations } = useConnectionOverview({
		search,
		label,
	});

	const activateConnection = useStable((con: Connection) => {
		navigateConnection(con.id);
		openedHandle.close();
	});

	const activateInstance = useStable((instance: CloudInstance) => {
		activateConnection(resolveInstanceConnection(instance));
	});

	const [handleKeyDown, selected] = useKeyNavigation([], () => {}, connection || undefined);

	useIntent("open-connections", ({ search }) => {
		if (search) {
			setSearch(search);
		}

		openedHandle.open();
	});

	return (
		<Modal
			opened={isOpen}
			onClose={openedHandle.close}
			transitionProps={{ transition: Y_SLIDE_TRANSITION }}
			centered={false}
			size="lg"
			onKeyDown={handleKeyDown}
			classNames={{
				content: classes.listingModal,
				body: classes.listingBody,
			}}
		>
			<Box p="lg">
				<Group
					mb="xs"
					gap="xs"
					c="bright"
				>
					<Icon
						path={iconServer}
						size="sm"
					/>
					<Text>Connections</Text>
				</Group>
				<TextInput
					flex={1}
					placeholder="Search for connections..."
					variant="unstyled"
					className={classes.listingSearch}
					autoFocus
					value={search}
					spellCheck={false}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</Box>

			<Divider mx="lg" />

			<ScrollArea.Autosize
				scrollbars="y"
				mah="calc(100vh - 225px)"
				mih={64}
			>
				<Stack
					gap="xl"
					p="lg"
				>
					{isEmpty && (
						<Text
							c="slate"
							ta="center"
							my="xl"
						>
							No connections found
						</Text>
					)}

					{sandbox && (
						<ConnectionEntry
							connection={sandbox}
							active={connection ?? ""}
							selected={selected}
							onClose={openedHandle.close}
							onConnect={activateConnection}
						/>
					)}

					{userConnections.length > 0 && (
						<Stack gap="xs">
							<Text
								fz="xl"
								fw={500}
								c="bright"
							>
								Connections
							</Text>
							{userConnections.map((con) => (
								<ConnectionEntry
									key={con.id}
									connection={con}
									active={connection ?? ""}
									selected={selected}
									onClose={openedHandle.close}
									onConnect={activateConnection}
								/>
							))}
						</Stack>
					)}

					{organizations.map((org) => (
						<Stack
							key={org.info.id}
							gap="xs"
						>
							<Group>
								<Text
									fz="xl"
									fw={500}
									c="bright"
								>
									{org.info.name}
								</Text>
								<Image
									src={cloudImg}
									height={16}
								/>
							</Group>
							{org.instances.map((instance) => (
								<InstanceEntry
									key={instance.id}
									instance={instance}
									active={connection ?? ""}
									selected={selected}
									onClose={openedHandle.close}
									onConnect={activateInstance}
								/>
							))}
						</Stack>
					))}
				</Stack>
			</ScrollArea.Autosize>
		</Modal>
	);
}

interface ConnectionEntryProps extends EntryProps {
	connection: Connection;
	active: string;
	selected: string;
	onConnect: (connection: Connection) => void;
	onClose: () => void;
}

function ConnectionEntry({
	connection,
	active,
	selected,
	onConnect,
	onClose,
	...other
}: ConnectionEntryProps) {
	const isActive = connection.id === active;

	const activate = useStable(() => {
		onConnect(connection);
	});

	return (
		<Entry
			key={connection.id}
			isActive={isActive}
			data-navigation-item-id={connection.id}
			className={clsx(
				classes.connection,
				selected === connection.id && classes.listingActive,
			)}
			onClick={activate}
			leftSection={<Icon path={USER_ICONS[connection.icon ?? 0]} />}
			{...other}
		>
			<Text truncate>{connection.name}</Text>
		</Entry>
	);
}

interface InstanceEntryProps extends EntryProps {
	instance: CloudInstance;
	active: string;
	selected: string;
	onConnect: (instance: CloudInstance) => void;
	onClose: () => void;
}

function InstanceEntry({
	instance,
	active,
	selected,
	onConnect,
	onClose,
	...other
}: InstanceEntryProps) {
	const connections = useConnectionList();

	const connection = useMemo(() => {
		return connections.find((c) => c.authentication.cloudInstance === instance.id);
	}, [connections, instance.id]);

	const isActive = connection?.id === active;

	const activate = useStable(() => {
		onConnect(instance);
	});

	return (
		<Entry
			key={instance.id}
			isActive={isActive}
			data-navigation-item-id={instance.id}
			className={clsx(classes.connection, selected === null && classes.listingActive)}
			onClick={activate}
			leftSection={<Icon path={connection ? USER_ICONS[connection.icon] : iconCloud} />}
			{...other}
		>
			<Text truncate>{instance.name}</Text>
		</Entry>
	);
}
