import { Box, Button, Group, Stack, Text } from "@mantine/core";
import { useMemo } from "react";
import { useImmer } from "use-immer";
import { ConnectionAddressDetails } from "~/components/ConnectionDetails/address";
import { ConnectionAuthDetails } from "~/components/ConnectionDetails/authentication";
import { ConnectionNameDetails } from "~/components/ConnectionDetails/connection";
import { ConnectionLabelsDetails } from "~/components/ConnectionDetails/labels";
import { Form } from "~/components/Form";
import { Section } from "~/components/Section";
import { useStable } from "~/hooks/stable";
import { openConnection } from "~/screens/surrealist/pages/Connection/connection/connection";
import { useConfigStore } from "~/stores/config";
import type { Connection } from "~/types";
import { getActiveConnection, isConnectionValid } from "~/util/connection";

export interface ConnectionFormProps {
	value: Connection;
}

export function ConnectionForm({ value }: ConnectionFormProps) {
	const { updateConnection } = useConfigStore.getState();

	const [connection, setConnection] = useImmer(value);

	const isValid = useMemo(() => {
		return connection.name && isConnectionValid(connection.authentication);
	}, [connection.authentication, connection.name]);

	const handleSave = useStable(() => {
		updateConnection(connection);

		if (getActiveConnection() === connection.id) {
			openConnection({ connection });
		}
	});

	const isCloud = value.authentication.mode === "cloud";

	return (
		<Form onSubmit={handleSave}>
			<Stack gap="xl">
				<Section
					title="Connection"
					description="Specify an icon and name for this connection"
				>
					<ConnectionNameDetails
						value={connection}
						onChange={setConnection}
					/>
				</Section>

				{isCloud ? (
					<Section
						title="Protocol"
						description="Select a communication protocol for this connection"
					>
						<ConnectionAddressDetails
							value={connection}
							onChange={setConnection}
							withHostname={false}
						/>
					</Section>
				) : (
					<>
						<Section
							title="Remote address"
							description="Select a communication protocol and specify instance address"
						>
							<ConnectionAddressDetails
								value={connection}
								onChange={setConnection}
							/>
						</Section>

						<Section
							title="Authentication"
							description="Specify how you want to access your instance"
						>
							<ConnectionAuthDetails
								value={connection}
								onChange={setConnection}
							/>
						</Section>
					</>
				)}

				<Section
					title="Labels"
					description="Add filtering labels to this connection"
				>
					<ConnectionLabelsDetails
						value={connection}
						onChange={setConnection}
					/>
				</Section>

				<Group justify="flex-end">
					<Button
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

export interface ConnectionDetailsReadoutProps {
	connection: Connection;
}

export function ConnectionDetailsReadout({ connection }: ConnectionDetailsReadoutProps) {
	return (
		<Box>
			<Text
				fz="sm"
				fw={600}
			>
				Connection ID
			</Text>
			<Text
				className="selectable"
				mt={4}
			>
				{connection.id}
			</Text>
		</Box>
	);
}
