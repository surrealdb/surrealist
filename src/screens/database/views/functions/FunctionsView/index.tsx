import { Box, Button, Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { type ChangeEvent, memo, useRef, useState } from "react";
import { Panel, PanelGroup } from "react-resizable-panels";
import { useImmer } from "use-immer";
import { adapter } from "~/adapter";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { Introduction } from "~/components/Introduction";
import { PanelDragger } from "~/components/Pane/dragger";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useIsConnected } from "~/hooks/connection";
import { usePanelMinSize } from "~/hooks/panels";
import { useSaveable } from "~/hooks/save";
import { useDatabaseSchema } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { useViewEffect } from "~/hooks/view";
import { useConfirmation } from "~/providers/Confirmation";
import { executeQuery } from "~/screens/database/connection/connection";
import type { SchemaFunction } from "~/types";
import { showError } from "~/util/helpers";
import { iconChevronRight, iconFunction, iconOpen, iconPlus } from "~/util/icons";
import { buildFunctionDefinition, syncConnectionSchema } from "~/util/schema";
import { formatQuery, validateQuery } from "~/util/surrealql";
import { EditorPanel } from "../EditorPanel";
import { FunctionsPanel } from "../FunctionsPanel";

const FunctionsPanelLazy = memo(FunctionsPanel);
const EditorPanelLazy = memo(EditorPanel);

export function FunctionsView() {
	const isConnected = useIsConnected();
	const duplicationRef = useRef<SchemaFunction | null>(null);

	const { functions } = useDatabaseSchema();

	const [details, setDetails] = useImmer<SchemaFunction | null>(null);
	const [isCreating, isCreatingHandle] = useDisclosure();
	const [showCreator, showCreatorHandle] = useDisclosure();
	const [createName, setCreateName] = useState("");

	const [error, setError] = useState("");

	const handle = useSaveable({
		valid: !!details && details.args.every(([name, kind]) => name && kind),
		track: {
			details,
		},
		onSave: async () => {
			if (!details) return;

			const query = buildFunctionDefinition(details);

			try {
				const res = await executeQuery(query);
				const error = res[0].success
					? ""
					: (res[0].result as string).replace(
							"There was a problem with the database: ",
							"",
						);

				setError(error);

				if (error) {
					return false;
				}

				syncConnectionSchema();

				isCreatingHandle.close();
			} catch (err: any) {
				showError({
					title: "Failed to apply schema",
					subtitle: err.message,
				});
			}
		},
		onRevert({ details }) {
			setDetails(details);
			setError("");
		},
	});

	const updateCreateName = useStable((e: ChangeEvent<HTMLInputElement>) => {
		const name = e.target.value.replaceAll(/\s/g, "_").replaceAll(/[^\w:]/g, "");

		setCreateName(name);
	});

	const openCreator = useStable(() => {
		showCreatorHandle.open();
		duplicationRef.current = null;
		setCreateName("");
	});

	const editFunction = useStable((name: string) => {
		isCreatingHandle.close();

		const selectedFunction = functions.find((f) => f.name === name) || null;

		if (!selectedFunction) {
			showError({
				title: "Function not found",
				subtitle: "The selected function was not found",
			});
			return;
		}

		const isInvalid = validateQuery(selectedFunction.block);
		const block = isInvalid ? selectedFunction.block : formatQuery(selectedFunction.block);

		setDetails({
			...selectedFunction,
			block,
		});

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
				permissions: true,
				returns: "",
			}),
			name: createName,
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
			await syncConnectionSchema();

			setDetails(null);
			handle.track();
		},
	});

	useViewEffect("functions", () => {
		syncConnectionSchema();
	});

	const [minSize, ref] = usePanelMinSize(275);

	return (
		<>
			<Box
				h="100%"
				ref={ref}
			>
				<PanelGroup
					direction="horizontal"
					style={{ opacity: minSize === 0 ? 0 : 1 }}
				>
					<Panel
						defaultSize={minSize}
						minSize={minSize}
						maxSize={35}
					>
						<FunctionsPanelLazy
							active={details?.name || ""}
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
							<EditorPanelLazy
								handle={handle}
								details={details}
								error={error}
								isCreating={isCreating}
								onChange={setDetails as any}
								onDelete={removeFunction}
							/>
						) : (
							<Introduction
								title="Functions"
								icon={iconFunction}
								snippet={{
									language: "surrealql",
									code: `
										-- Define your functions with ease
										DEFINE FUNCTION fn::greet($name: string) {
											RETURN "Hello, " + $name + "!";
										};

										-- And invoke them from any query
										RETURN fn::greet("Tobie");
									`,
								}}
							>
								<Text>
									Schema functions allow you to define stored procedures that can
									be reused throughout your queries. This view allows you to
									effortlessly create and manage your functions.
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
										variant="light"
										rightSection={<Icon path={iconOpen} />}
										onClick={() =>
											adapter.openUrl(
												"https://surrealdb.com/docs/surrealdb/surrealql/statements/define/function",
											)
										}
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
				title={<PrimaryTitle>Create new function</PrimaryTitle>}
			>
				<Form onSubmit={createFunction}>
					<Stack>
						<TextInput
							placeholder="function_name"
							value={createName}
							spellCheck={false}
							onChange={updateCreateName}
							size="lg"
							autoFocus
							leftSection={
								<Text
									ff="mono"
									fz="xl"
									c="surreal"
									style={{ transform: "translate(4px, 1px)" }}
								>
									fn::
								</Text>
							}
							styles={{
								input: {
									fontFamily: "var(--mantine-font-family-monospace)",
								},
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

export default FunctionsView;
