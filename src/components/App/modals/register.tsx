import { Table, Text } from "@mantine/core";
import { Modal, PasswordInput, TextInput, Group, Button } from "@mantine/core";
import { useState } from "react";
import { useImmer } from "use-immer";
import { adapter } from "~/adapter";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { SENSITIVE_ACCESS_FIELDS } from "~/constants";
import { useBoolean } from "~/hooks/boolean";
import { useActiveConnection } from "~/hooks/connection";
import { useDatabaseSchema } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { useIntent } from "~/hooks/url";
import { authenticate, register } from "~/screens/database/connection/connection";
import { composeAuthentication } from "~/screens/database/connection/helpers";
import type { AccessField, SchemaAccess } from "~/types";
import { extractVariables, showError, showInfo } from "~/util/helpers";
import { iconAccountPlus } from "~/util/icons";

export function RegisterUserModal() {
	const { lastNamespace, lastDatabase, authentication } = useActiveConnection();
	const schema = useDatabaseSchema();

	const [isOpen, openedHandle] = useBoolean();
	const [access, setAccess] = useState<SchemaAccess | null>(null);
	const [fields, setFields] = useImmer<AccessField[]>([]);
	const [isLoading, setLoading] = useState(false);

	const registerUser = useStable(async () => {
		if (!access) return;

		const variables = fields.reduce((acc, field) => {
			acc[field.subject] = field.value;
			return acc;
		}, {} as any);

		const restoreAuth = await composeAuthentication(authentication);

		try {
			setLoading(true);
			
			console.log("Registering user with variables", variables);

			await register({
				access: access.name,
				namespace: lastNamespace,
				database: lastDatabase,
				variables,
			});

			showInfo({
				title: "User registered",
				subtitle: "The user has been successfully registered"
			});
		} catch(err: any) {
			adapter.warn('Auth', `Failed to register user: ${err.message}`);
			console.error(err);

			showError({
				title: "Registration failed",
				subtitle: err.message
			});
		} finally {
			setLoading(false);
			await authenticate(restoreAuth);
			openedHandle.close();
		}
	});

	useIntent("register-user", ({ access }) => {
		if (!access) return;

		const accessInfo = schema.accesses.find((a) => a.name === access);

		if (accessInfo && accessInfo.kind.kind === "RECORD") {
			const fields = extractVariables(accessInfo.kind.signup).map((field) => ({
				subject: field,
				value: "",
			}));
			
			setAccess(accessInfo);
			setFields(fields);
			openedHandle.open();
		}
	});
	
	return (
		<Modal
			size="md"
			opened={isOpen}
			onClose={openedHandle.close}
			trapFocus={false}
			title={
				<PrimaryTitle>Register user</PrimaryTitle>
			}
		>
			<Text>
				Please fill out the following required fields to register a new user with the access method <Text span c="bright">{access?.name}</Text>.
			</Text>

			<Form onSubmit={registerUser}>
				<Table mt="md">
					<Table.Thead>
						<Table.Tr>
							<Table.Th w="50%">Access field</Table.Th>
							<Table.Th w="50%">Value</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{fields.map((field, i) => {
							const fieldName = field.subject.toLowerCase();
							const ValueInput = SENSITIVE_ACCESS_FIELDS.has(fieldName)
								? PasswordInput
								: TextInput;

							return (
								<Table.Tr key={field.subject}>
									<Table.Td c="bright">
										<Text fw={600}>
											{field.subject}
										</Text>
									</Table.Td>
									<Table.Td c="bright">
										<ValueInput
											size="xs"
											value={field.value}
											spellCheck={false}
											onChange={e =>
												setFields((draft) => {
													draft[i].value = e.target.value;
												})
											}
										/>
									</Table.Td>
								</Table.Tr>
							);
						})}
					</Table.Tbody>
				</Table>
				<Group mt="lg">
					<Button
						onClick={openedHandle.close}
						variant="light"
						color="slate"
					>
						Close
					</Button>
					<Spacer />
					<Button
						variant="gradient"
						type="submit"
						rightSection={<Icon path={iconAccountPlus} />}
						loading={isLoading}
					>
						Register
					</Button>
				</Group>
			</Form>
		</Modal>
	);
}