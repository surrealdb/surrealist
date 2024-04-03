import { Button, Center, Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import { FunctionsPanel } from "../FunctionsPanel";
import { EditorPanel } from "../EditorPanel";
import { ChangeEvent, useRef, useState } from "react";
import { Icon } from "~/components/Icon";
import { iconChevronRight, iconFunction, iconPlus } from "~/util/icons";
import { useStable } from "~/hooks/stable";
import { useDisclosure } from "@mantine/hooks";
import { ModalTitle } from "~/components/ModalTitle";
import { Form } from "~/components/Form";
import { FunctionDefinition } from "~/types";
import { useImmer } from "use-immer";
import { useSchema } from "~/hooks/schema";
import { useSaveable } from "~/hooks/save";
import { buildFunctionDefinition, syncDatabaseSchema } from "~/util/schema";
import { getActiveSurreal, getSurreal } from "~/util/surreal";
import { useConfirmation } from "~/providers/Confirmation";
import { useViewEffect } from "~/hooks/view";

export function FunctionsView() {
	const functions = useSchema()?.functions ?? [];
	const duplicationRef = useRef<FunctionDefinition | null>(null);

	const [details, setDetails] = useImmer<FunctionDefinition | null>(null);
	const [isCreating, isCreatingHandle] = useDisclosure();
	const [showCreator, showCreatorHandle] = useDisclosure();
	const [createName, setCreateName] = useState("");

	const handle = useSaveable({
		valid: !!details && details.arguments.every((arg) => arg.name && arg.kind),
		track: {
			details
		},
		onSave: async () => {
			const query = buildFunctionDefinition(details!);

			await getActiveSurreal().query(query).catch(console.error);
			await syncDatabaseSchema({
				functions: true
			});

			editFunction(details!.name);
		},
		onRevert({ details }) {
			setDetails(details);
		},
	});

	const updateCreateName = useStable((e: ChangeEvent<HTMLInputElement>) => {
		const name = e.target.value
			.replaceAll(/\s/g, '_')
			.replaceAll(/[^\w:]/g, '')
			.toLocaleLowerCase();

		setCreateName(name);
	});

	const openCreator = useStable(() => {
		showCreatorHandle.open();
		duplicationRef.current = null;
		setCreateName("");
	});

	const editFunction = useStable((name: string) => {
		isCreatingHandle.close();
		setDetails(functions.find((f) => f.name === name) || null);
		handle.track();
	});

	const createFunction = useStable(async () => {
		const duplication = duplicationRef.current;

		showCreatorHandle.close();
		isCreatingHandle.open();

		setDetails({
			...(duplication || {
				arguments: [],
				comment: "",
				block: "",
				permission: "FULL"
			}),
			name: createName
		});

		duplicationRef.current = null;
		handle.track();
	});

	const duplicateFunction = useStable((def: FunctionDefinition) => {
		showCreatorHandle.open();
		duplicationRef.current = def;
		setCreateName(def.name);
	});

	const removeFunction = useConfirmation({
		message: "You are about to remove this function. This action cannot be undone.",
		confirmText: "Remove",
		onConfirm: async (name: string) => {
			const surreal = getSurreal();

			if (!surreal) {
				return;
			}

			await surreal.query(`REMOVE FUNCTION fn::${name}`);
			await syncDatabaseSchema({
				functions: true
			});

			setDetails(null);
			handle.track();
		},
	});

	useViewEffect("functions", () => {
		syncDatabaseSchema({
			functions: true
		});
	});

	return (
		<>
			<Group
				wrap="nowrap"
				gap="var(--surrealist-divider-size)"
				h="100%"
				mah="100%"
				style={{ flexShrink: 1, minHeight: 0 }}
			>
				<FunctionsPanel
					active={details?.name || ''}
					functions={functions}
					onCreate={openCreator}
					onDelete={removeFunction}
					onDuplicate={duplicateFunction}
					onSelect={editFunction}
				/>
				{details ? (
					<EditorPanel
						handle={handle}
						details={details}
						isCreating={isCreating}
						onChange={setDetails as any}
						onDelete={removeFunction}
					/>
				) : (
					<Center flex={1}>
						<Stack
							align="center"
							justify="center"
						>
							<Icon path={iconFunction} size={2.5} />
							Select a function to view or edit
							<Group>
								<Button
									variant="light"
									leftSection={<Icon path={iconPlus} />}
									onClick={openCreator}
								>
									Create function
								</Button>
							</Group>
						</Stack>
					</Center>
				)}
			</Group>

			<Modal
				opened={showCreator}
				onClose={showCreatorHandle.close}
				title={
					<ModalTitle>Create new function</ModalTitle>
				}
			>
				<Form onSubmit={createFunction}>
					<Stack>
						<TextInput
							placeholder="function_name"
							value={createName}
							onChange={updateCreateName}
							size="lg"
							autoFocus
							leftSection={
								<Text
									ff="mono"
									fz="xl"
									c="surreal"
									style={{ transform: 'translate(4px, 1px)' }}
								>
									fn::
								</Text>
							}
							styles={{
								input: {
									fontFamily: 'var(--mantine-font-family-monospace)'
								}
							}}
						/>
						<Group mt="lg">
							<Button
								onClick={showCreatorHandle.close}
								color="slate"
								variant="light"
								flex={1}
							>
								Close
							</Button>
							<Button
								type="submit"
								variant="gradient"
								flex={1}
								disabled={!createName}
								rightSection={<Icon path={iconChevronRight} />}
							>
								Continue
							</Button>
						</Group>
					</Stack>
				</Form>
			</Modal>
		</>
	);
}
