import {
	ActionIcon,
	Box,
	Button,
	CopyButton,
	Group,
	SimpleGrid,
	Stack,
	TextInput,
} from "@mantine/core";
import { Icon, iconCheck, iconCopy } from "@surrealdb/ui";
import { useMemo } from "react";
import { useImmer } from "use-immer";
import { ConnectionAddressDetails } from "~/components/ConnectionDetails/address";
import { ConnectionAuthDetails } from "~/components/ConnectionDetails/authentication";
import { ConnectionNameDetails } from "~/components/ConnectionDetails/connection";
import { ConnectionLabelsDetails } from "~/components/ConnectionDetails/labels";
import { Form } from "~/components/Form";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import { useStable } from "~/hooks/stable";
import { useConfigStore } from "~/stores/config";
import { getActiveConnection, isConnectionValid } from "~/util/connection";
import { openConnection } from "../../connection/connection";
import type { ConnectionSettingsTabProps } from "../types";

export function ConnectionGeneralTab({
	connection: conn,
	instanceQuery,
}: ConnectionSettingsTabProps) {
	const { updateConnection } = useConfigStore.getState();

	const [connection, setConnection] = useImmer(conn);

	const isValid = useMemo(() => {
		return connection.name && isConnectionValid(connection.authentication);
	}, [connection.authentication, connection.name]);

	const handleSave = useStable(() => {
		updateConnection(connection);

		if (getActiveConnection() === connection.id) {
			openConnection({ connection });
		}
	});

	const isCloud = connection.authentication.mode === "cloud";

	return (
		<Stack>
			<PrimaryTitle fz={32}>General</PrimaryTitle>

			<Form onSubmit={handleSave}>
				<SimpleGrid cols={2}>
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
						<>
							<Section
								title="Instance ID"
								description="This ID may be requested by the SurrealDB support team"
							>
								<TextInput
									value={instanceQuery?.data?.id ?? ""}
									rightSection={
										<CopyButton value={instanceQuery.data?.id ?? ""}>
											{({ copied, copy }) => (
												<ActionIcon
													variant={copied ? "gradient" : undefined}
													aria-label="Copy instance ID"
													radius="xs"
													size="md"
													onClick={copy}
												>
													<Icon path={copied ? iconCheck : iconCopy} />
												</ActionIcon>
											)}
										</CopyButton>
									}
									styles={{
										input: {
											fontFamily: "var(--mantine-font-family-monospace)",
										},
									}}
								/>
							</Section>
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
						</>
					) : (
						<Section
							title="Remote address"
							description="Select a communication protocol and specify instance address"
						>
							<ConnectionAddressDetails
								value={connection}
								onChange={setConnection}
							/>
						</Section>
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
				</SimpleGrid>

				{!isCloud && (
					<Box mt="md">
						<Section
							title="Authentication"
							description="Specify how you want to access your instance"
						>
							<ConnectionAuthDetails
								value={connection}
								onChange={setConnection}
							/>
						</Section>
					</Box>
				)}

				<Group mt="xl">
					<Button
						variant="gradient"
						disabled={!isValid}
						type="submit"
					>
						Save changes
					</Button>
				</Group>
			</Form>
		</Stack>
	);
}
