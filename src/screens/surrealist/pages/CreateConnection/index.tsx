import classes from "./style.module.scss";

import { Box, Button, Group, Paper, ScrollArea, Stack, Text } from "@mantine/core";
import { Link } from "wouter";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { TopGlow } from "~/components/TopGlow";
import { iconArrowLeft } from "~/util/icons";
import { ConnectionNameDetails } from "~/components/ConnectionDetails/connection";
import { useImmer } from "use-immer";
import { createBaseConnection } from "~/util/defaults";
import { useConfigStore } from "~/stores/config";
import { ConnectionAddressDetails } from "~/components/ConnectionDetails/address";
import { ConnectionAuthDetails } from "~/components/ConnectionDetails/authentication";
import { ConnectionLabelsDetails } from "~/components/ConnectionDetails/labels";
import { useMemo } from "react";
import { isConnectionValid } from "~/util/connection";
import { useConnectionNavigator } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";

export function CreateConnectionPage() {
	const { settings, addConnection } = useConfigStore.getState();

	const [connection, setConnection] = useImmer(createBaseConnection(settings));
	const navigateConnection = useConnectionNavigator();

	const isValid = useMemo(() => {
		return connection.name && isConnectionValid(connection.authentication);
	}, [connection.authentication, connection.name]);

	const handleCreate = useStable(() => {
		addConnection(connection);
		navigateConnection(connection.id);
	});

	return (
		<Box
			flex={1}
			pos="relative"
		>
			<TopGlow offset={200} />

			<ScrollArea
				pos="absolute"
				scrollbars="y"
				type="scroll"
				inset={0}
				className={classes.scrollArea}
				viewportProps={{
					style: { paddingBlock: 75 },
				}}
			>
				<Stack
					mx="auto"
					maw={650}
					gap="xl"
				>
					<Box>
						<PrimaryTitle fz={26}>New connection</PrimaryTitle>
						<Text fz="xl">Connect to any SurrealDB instance</Text>
					</Box>

					<Box mt="xl">
						<Text
							fz="xl"
							fw={600}
							c="bright"
						>
							Connection
						</Text>
						<Text>Specify an icon and name for this connection</Text>
					</Box>

					<ConnectionNameDetails
						value={connection}
						onChange={setConnection}
					/>

					<Box mt="xl">
						<Text
							fz="xl"
							fw={600}
							c="bright"
						>
							Remote address
						</Text>
						<Text>Select a communication protocol and specify instance address</Text>
					</Box>

					<ConnectionAddressDetails
						value={connection}
						onChange={setConnection}
					/>

					<Box mt="xl">
						<Text
							fz="xl"
							fw={600}
							c="bright"
						>
							Authentication
						</Text>
						<Text>Specify how you want to access your instance</Text>
					</Box>

					<Paper p="lg">
						<ConnectionAuthDetails
							value={connection}
							onChange={setConnection}
						/>
					</Paper>

					<Box mt="xl">
						<Text
							fz="xl"
							fw={600}
							c="bright"
						>
							Labels
						</Text>
						<Text>Add filtering labels to this connection</Text>
					</Box>

					<ConnectionLabelsDetails
						value={connection}
						onChange={setConnection}
					/>

					<Group mt="xl">
						<Link to="/overview">
							<Button
								w={150}
								color="slate"
								variant="light"
								leftSection={<Icon path={iconArrowLeft} />}
							>
								Back to overview
							</Button>
						</Link>
						<Spacer />
						<Button
							w={150}
							type="submit"
							variant="gradient"
							disabled={!isValid}
							onClick={handleCreate}
						>
							Create connection
						</Button>
					</Group>
				</Stack>
			</ScrollArea>
		</Box>
	);
}
