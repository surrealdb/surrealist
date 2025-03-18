import { Box, Button, Group, Text } from "@mantine/core";
import { Stack } from "@mantine/core";
import { closeModal, openModal } from "@mantine/modals";
import { useMemo } from "react";
import { useImmer } from "use-immer";
import { ConnectionAddressDetails } from "~/components/ConnectionDetails/address";
import { ConnectionAuthDetails } from "~/components/ConnectionDetails/authentication";
import { ConnectionNameDetails } from "~/components/ConnectionDetails/connection";
import { ConnectionLabelsDetails } from "~/components/ConnectionDetails/labels";
import { Form } from "~/components/Form";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useStable } from "~/hooks/stable";
import { useConfigStore } from "~/stores/config";
import { Connection } from "~/types";
import { isConnectionValid } from "~/util/connection";

export function openConnectionEditModal(connection: Connection) {
	openModal({
		modalId: "connection-edit",
		title: <PrimaryTitle>Edit connection</PrimaryTitle>,
		withCloseButton: true,
		children: <ConnectionEditor value={connection} />,
	});
}

interface ConnectionEditorProps {
	value: Connection;
}

function ConnectionEditor({ value }: ConnectionEditorProps) {
	const { updateConnection } = useConfigStore.getState();

	const [connection, setConnection] = useImmer(value);

	const isValid = useMemo(() => {
		return connection.name && isConnectionValid(connection.authentication);
	}, [connection.authentication, connection.name]);

	const handleSave = useStable(() => {
		updateConnection(connection);
		closeModal("connection-edit");
	});

	const isCloud = value.authentication.mode === "cloud";

	return (
		<Form onSubmit={handleSave}>
			<Stack gap="xl">
				<Box>
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

				{isCloud ? (
					<>
						<Box mt="xl">
							<Text
								fz="xl"
								fw={600}
								c="bright"
							>
								Protocol
							</Text>
							<Text>Select a communication protocol for this connection</Text>
						</Box>

						<ConnectionAddressDetails
							value={connection}
							onChange={setConnection}
							withHostname={false}
						/>
					</>
				) : (
					<>
						<Box mt="xl">
							<Text
								fz="xl"
								fw={600}
								c="bright"
							>
								Remote address
							</Text>
							<Text>
								Select a communication protocol and specify instance address
							</Text>
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

						<ConnectionAuthDetails
							value={connection}
							onChange={setConnection}
						/>
					</>
				)}

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
					<Button
						flex={1}
						color="slate"
						variant="light"
						onClick={() => closeModal("connection-edit")}
					>
						Close
					</Button>
					<Button
						flex={1}
						variant="gradient"
						disabled={!isValid}
						type="submit"
					>
						Save changes
					</Button>
				</Group>
			</Stack>
		</Form>
	);
}
