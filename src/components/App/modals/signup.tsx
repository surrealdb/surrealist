import {
	Alert,
	Button,
	Group,
	Modal,
	PasswordInput,
	Stack,
	Table,
	Text,
	TextInput,
} from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";
import { useLayoutEffect, useState } from "react";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { SENSITIVE_ACCESS_FIELDS } from "~/constants";
import { useConnection } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { openConnectionEditModal } from "~/modals/edit-connection";
import { openConnection } from "~/screens/surrealist/connection/connection";
import { useInterfaceStore } from "~/stores/interface";
import { getConnection, getConnectionById } from "~/util/connection";
import { iconWarning } from "~/util/icons";

export function AccessSignupModal() {
	const { closeAccessSignup } = useInterfaceStore.getState();

	const [error, setError] = useState("");
	const [loading, loadingHandle] = useDisclosure();
	const opened = useInterfaceStore((s) => s.showAccessSignup);

	const [connectionId, _authMode, accessFields] = useConnection((c) => [
		c?.id ?? "",
		c?.authentication.mode,
		c?.authentication.accessFields ?? [],
	]);

	const openEditor = useStable(() => {
		const connection = getConnectionById(connectionId);

		if (connection) {
			openConnectionEditModal(connection);
			closeAccessSignup();
		}
	});

	const createAccount = useStable(() => {
		loadingHandle.open();

		const connection = getConnection();

		if (!connection) {
			return;
		}

		openConnection({
			connection: {
				...connection,
				authentication: {
					...connection.authentication,
					mode: "access-signup",
				},
			},
		})
			.then(() => {
				closeAccessSignup();
			})
			.catch((err) => {
				setError(err.message);
			})
			.finally(() => {
				loadingHandle.close();
			});
	});

	useLayoutEffect(() => {
		if (opened) {
			setError("");
		}
	}, [opened]);

	return (
		<Modal
			opened={opened}
			onClose={closeAccessSignup}
			title={<PrimaryTitle>Register with access method</PrimaryTitle>}
		>
			<Stack>
				{error && (
					<Alert
						color="red.5"
						icon={<Icon path={iconWarning} />}
						title="Connection error"
					>
						{error}
					</Alert>
				)}
				<Text>
					The provided access fields do not match any existing user. Confirm these access
					fields and press "Sign up" below to create a new user.
				</Text>

				<Table>
					<Table.Thead>
						<Table.Tr>
							<Table.Th w="50%">Access field</Table.Th>
							<Table.Th w="50%">Value</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{accessFields.map((field) => {
							const fieldName = field.subject.toLowerCase();
							const ValueInput = SENSITIVE_ACCESS_FIELDS.has(fieldName)
								? PasswordInput
								: TextInput;

							return (
								<Table.Tr key={field.subject}>
									<Table.Td c="bright">
										<Text fw={600}>{field.subject}</Text>
									</Table.Td>
									<Table.Td c="bright">
										<ValueInput
											size="xs"
											readOnly
											variant="unstyled"
											value={field.value}
											spellCheck={false}
											styles={{
												input: {
													backgroundColor: "unset",
												},
											}}
										/>
									</Table.Td>
								</Table.Tr>
							);
						})}
					</Table.Tbody>
				</Table>

				<Group>
					<Button
						color="slate"
						variant="light"
						onClick={closeAccessSignup}
					>
						Close
					</Button>
					<Spacer />
					<Button
						color="surreal"
						variant="light"
						onClick={openEditor}
					>
						Edit connection
					</Button>
					<Button
						type="submit"
						variant="gradient"
						loading={loading}
						onClick={createAccount}
					>
						Sign up
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
