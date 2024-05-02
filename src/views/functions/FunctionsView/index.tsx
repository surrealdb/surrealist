import { Box, Button, Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import { FunctionsPanel } from "../FunctionsPanel";
import { EditorPanel } from "../EditorPanel";
import { ChangeEvent, useRef, useState } from "react";
import { Icon } from "~/components/Icon";
import { iconChevronRight, iconFunction, iconOpen, iconPlus } from "~/util/icons";
import { useStable } from "~/hooks/stable";
import { useDisclosure } from "@mantine/hooks";
import { ModalTitle } from "~/components/ModalTitle";
import { Form } from "~/components/Form";
import { SchemaFunction } from "~/types";
import { useImmer } from "use-immer";
import { useSchema } from "~/hooks/schema";
import { useSaveable } from "~/hooks/save";
import { buildFunctionDefinition, syncDatabaseSchema } from "~/util/schema";
import { useConfirmation } from "~/providers/Confirmation";
import { useViewEffect } from "~/hooks/view";
import { executeQuery } from "~/connection";
import { Panel, PanelGroup } from "react-resizable-panels";
import { PanelDragger } from "~/components/Pane/dragger";
import { usePanelMinSize } from "~/hooks/panels";
import { adapter } from "~/adapter";
import { Introduction } from "~/components/Introduction";
import { useIsConnected } from "~/hooks/connection";

export function FunctionsView() {
	const functions = useSchema()?.functions ?? [];
	const duplicationRef = useRef<SchemaFunction | null>(null);

	const [details, setDetails] = useImmer<SchemaFunction | null>(null);
	const [isCreating, isCreatingHandle] = useDisclosure();
	const [showCreator, showCreatorHandle] = useDisclosure();
	const [createName, setCreateName] = useState("");

	const isConnected = useIsConnected();

	const handle = useSaveable({
		valid: !!details && details.args.every(([name, kind]) => name && kind),
		track: {
			details
		},
		onSave: async () => {
			const query = buildFunctionDefinition(details!);

			await executeQuery(query).catch(console.error);
			await syncDatabaseSchema();

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
				args: [],
				comment: "",
				block: "",
				permissions: true
			}),
			name: createName
		});

		duplicationRef.current = null;
		handle.track();
	});

	const duplicateFunction = useStable((def: SchemaFunction) => {
		showCreatorHandle.open();
		duplicationRef.current = def;
		setCreateName(def.name);
	});

	const removeFunction = useConfirmation({
		message: "You are about to remove this function. This action cannot be undone.",
		confirmText: "Remove",
		onConfirm: async (name: string) => {
			await executeQuery(`REMOVE FUNCTION fn::${name}`);
			await syncDatabaseSchema();

			setDetails(null);
			handle.track();
		},
	});

	useViewEffect("functions", () => {
		syncDatabaseSchema();
	});

	const [minSize, ref] = usePanelMinSize(275);

	return (
		<>
			<Box h="100%" ref={ref}>
				<PanelGroup direction="horizontal">
					<Panel
						defaultSize={minSize}
						minSize={minSize}
						maxSize={35}
					>
						<FunctionsPanel
							active={details?.name || ''}
							functions={functions}
							onCreate={openCreator}
							onDelete={removeFunction}
							onDuplicate={duplicateFunction}
							onSelect={editFunction}
						/>
					</Panel>
					<PanelDragger />
					<Panel minSize={minSize}>
						{details ? (
							<EditorPanel
								handle={handle}
								details={details}
								isCreating={isCreating}
								onChange={setDetails as any}
								onDelete={removeFunction}
							/>
						) : (
							<Introduction
								title="Functions"
								icon={iconFunction}
								snippet={{
									code: `
										-- Define your functions with ease
										DEFINE FUNCTION fn::greet($name: string) {
											RETURN "Hello, " + $name + "!";
										};
										
										-- And invoke them from any query
										RETURN fn::greet("Tobie");
									`
								}}
							>
								<Text>
									Schema functions allow you to define stored procedures that can be reused throughout your queries.
									This view allows you to effortlessly create and manage your functions.
								</Text>
								<Group>
									<Button
										flex={1}
										variant="gradient"
										leftSection={<Icon path={iconPlus} />}
										disabled={!isConnected}
										onClick={openCreator}
									>
										Create function
									</Button>
									<Button
										flex={1}
										color="slate"
										rightSection={<Icon path={iconOpen} />}
										onClick={() => adapter.openUrl("https://surrealdb.com/docs/surrealdb/surrealql/statements/define/function")}
									>
										Learn more
									</Button>
								</Group>
							</Introduction>
						)}
					</Panel>
				</PanelGroup>
			</Box>

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
