import {
	Modal,
	Stack,
	Paper,
	Group,
	TextInput,
	ActionIcon,
	Button,
	PasswordInput,
	Select,
	SimpleGrid,
	Text,
	SegmentedControl,
	Alert
} from "@mantine/core";

import { mdiClose, mdiInformation, mdiPlus } from "@mdi/js";
import { Icon } from "../Icon";
import { Spacer } from "../Spacer";
import { AUTH_MODES } from "~/constants";
import { AuthMode, ConnectMethod, ConnectionOptions } from "~/types";
import { Updater } from "use-immer";
import { useState } from "react";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { ModalTitle } from "../ModalTitle";

const METHODS = [
	{ label: 'Database', value: 'remote' },
	{ label: 'Sandbox', value: 'local' }
];

export interface ConnectionDetailsProps {
	value: Partial<ConnectionOptions>;
	onChange: Updater<ConnectionOptions>;
	optional?: boolean;
	placeholders?: Partial<ConnectionOptions>;
	withLocal?: boolean;
}

export function ConnectionDetails({ value, onChange, optional, placeholders }: ConnectionDetailsProps) {
	const isLight = useIsLight();
	const authMode = value.authMode || placeholders?.authMode;
	const modePlaceholder = AUTH_MODES.find((mode) => mode.value === placeholders?.authMode)?.label;
	const passPlaceholder = placeholders?.password && "•".repeat(placeholders.password.length);
	const [editingScope, setEditingScope] = useState(false);

	const openScopeEditor = useStable(() => {
		setEditingScope(true);
	});

	const closeEditingScope = useStable(() => {
		setEditingScope(false);
	});

	const addScopeField = useStable(() => {
		onChange((draft) => {
			draft.scopeFields.push({
				subject: "",
				value: "",
			});
		});
	});

	const namespaceInput = (
		<TextInput
			label="Namespace"
			value={value.namespace || ""}
			placeholder={placeholders?.namespace}
			onChange={(e) =>
				onChange((draft) => {
					draft.namespace = e.target.value;
				})
			}
		/>
	);

	const databaseInput = (
		<TextInput
			label="Database"
			value={value.database || ""}
			placeholder={placeholders?.database}
			onChange={(e) =>
				onChange((draft) => {
					draft.database = e.target.value;
				})
			}
		/>
	);

	return (
		<>
			<SegmentedControl
				data={METHODS}
				fullWidth
				mb="sm"
				color="surreal"
				value={value.method || ''}
				onChange={(val) =>
					onChange((draft) => {
						draft.method = val as ConnectMethod;
					})
				}
			/>

			{value.method == 'remote' ? (
				<SimpleGrid cols={2} spacing="xl">
					<Stack>
						<TextInput
							label="Endpoint URL"
							value={value.endpoint || ""}
							placeholder={placeholders?.endpoint}
							autoFocus={!optional}
							onChange={(e) =>
								onChange((draft) => {
									draft.endpoint = e.target.value;
								})
							}
						/>
						{namespaceInput}
						{databaseInput}
					</Stack>
					<Stack>
						<Select
							label="Authentication mode"
							value={value.authMode || ""}
							placeholder={modePlaceholder}
							clearable
							data={AUTH_MODES}
							onChange={(value) =>
								onChange((draft) => {
									draft.authMode = value as AuthMode;
								})
							}
						/>
						{authMode !== "scope" && authMode !== "none" && (
							<>
								<TextInput
									label="Username"
									value={value.username || ""}
									placeholder={placeholders?.username}
									onChange={(e) =>
										onChange((draft) => {
											draft.username = e.target.value;
										})
									}
								/>
								<PasswordInput
									label="Password"
									value={value.password || ""}
									placeholder={passPlaceholder}
									onChange={(e) =>
										onChange((draft) => {
											draft.password = e.target.value;
										})
									}
								/>
							</>
						)}

						{authMode === "scope" && (
							<>
								<TextInput
									label="Scope"
									value={value.scope || ""}
									placeholder={placeholders?.scope}
									onChange={(e) =>
										onChange((draft) => {
											draft.scope = e.target.value;
										})
									}
								/>
								<Button mt={21} color="blue" variant="outline" onClick={openScopeEditor}>
									Edit scope data
								</Button>
							</>
						)}
					</Stack>
				</SimpleGrid>
			) : (
				<>
					<Alert
						mb="lg"
						color="blue"
						icon={<Icon path={mdiInformation} />}
					>
						Sandbox sessions provide a convenient way to test queries locally without having to install SurrealDB, however data is kept in memory and
						does not persist between restarts.
					</Alert>
					<SimpleGrid cols={2} spacing="xl">
						{namespaceInput}
						{databaseInput}
					</SimpleGrid>
				</>
			)}
			
			<Modal
				opened={editingScope}
				onClose={closeEditingScope}
				size={560}
				title={<ModalTitle>Editing scope data</ModalTitle>}
			>
				{value.scopeFields?.length === 0 ? (
					<Text color="gray" italic>
						No scope data defined
					</Text>
				) : (
					<Stack>
						{value.scopeFields?.map((field, i) => (
							<Paper key={i}>
								<Group>
									<TextInput
										placeholder="Key"
										style={{ flex: 1 }}
										value={field.subject}
										onChange={(e) =>
											onChange((draft) => {
												draft.scopeFields[i].subject = e.target.value;
											})
										}
									/>
									<TextInput
										placeholder="Value"
										style={{ flex: 1 }}
										value={field.value}
										onChange={(e) =>
											onChange((draft) => {
												draft.scopeFields[i].value = e.target.value;
											})
										}
									/>
									<ActionIcon
										color="red"
										title="Remove field"
										onClick={() =>
											onChange((draft) => {
												draft.scopeFields.splice(i, 1);
											})
										}>
										<Icon path={mdiClose} color="red" />
									</ActionIcon>
								</Group>
							</Paper>
						))}
					</Stack>
				)}

				<Group mt="lg">
					<Button color={isLight ? "light.5" : "light.3"} variant="light" onClick={closeEditingScope}>
						Back
					</Button>
					<Spacer />
					<Button rightIcon={<Icon path={mdiPlus} />} variant="light" color="blue" onClick={addScopeField}>
						Add field
					</Button>
				</Group>
			</Modal>
		</>
	);
}
