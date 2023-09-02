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
} from "@mantine/core";

import { mdiClose, mdiPlus } from "@mdi/js";
import { Icon } from "../Icon";
import { Spacer } from "../Spacer";
import { AUTH_MODES } from "~/constants";
import { AuthMode, ConnectionOptions } from "~/types";
import { Updater } from "use-immer";
import { useState } from "react";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { ModalTitle } from "../ModalTitle";

export interface ConnectionDetailsProps {
	value: Partial<ConnectionOptions>;
	onChange: Updater<ConnectionOptions>;
	optional?: boolean;
	placeholders?: Partial<ConnectionOptions>;
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

	return (
		<>
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
