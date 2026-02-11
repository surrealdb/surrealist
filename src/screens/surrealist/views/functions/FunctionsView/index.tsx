import { Box, Button, Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Icon, iconChevronRight, iconFunction, iconOpen, iconPlus } from "@surrealdb/ui";
import { type ChangeEvent, memo, useEffect, useRef, useState } from "react";
import { Panel, PanelGroup } from "react-resizable-panels";
import { useImmer } from "use-immer";
import { adapter } from "~/adapter";
import { Form } from "~/components/Form";
import { Introduction } from "~/components/Introduction";
import { PanelDragger } from "~/components/Pane/dragger";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { SidekickPanel } from "~/components/Sidekick/panel";
import { useConnection, useIsConnected, useRequireDatabase } from "~/hooks/connection";
import { usePanelMinSize } from "~/hooks/panels";
import { useViewFocus } from "~/hooks/routing";
import { useSaveable } from "~/hooks/save";
import { useDatabaseSchema } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { useConfirmation } from "~/providers/Confirmation";
import {
	composeHttpConnection,
	executeQuery,
	getSurrealQL,
} from "~/screens/surrealist/connection/connection";
import type { FunctionDetails, SchemaFunction, SchemaModel } from "~/types";
import { tagEvent } from "~/util/analytics";
import { createBaseAuthentication } from "~/util/defaults";
import { showErrorNotification } from "~/util/helpers";
import { buildFunctionDefinition, buildModelDefinition, syncConnectionSchema } from "~/util/schema";
import { FunctionEditorPanel } from "../FunctionEditorPanel";
import { FunctionPropertiesPanel } from "../FunctionPropertiesPanel";
import { FunctionsPanel } from "../FunctionsPanel";
import { ModelPanel } from "../ModelPanel";

const SURML_FILTERS = [
	{
		name: "SurrealML Model",
		extensions: ["surml", "surrealml"],
	},
];

const FunctionsPanelLazy = memo(FunctionsPanel);

export function FunctionsView() {
	const isConnected = useIsConnected();
	const duplicationRef = useRef<FunctionDetails | null>(null);

	const [auth] = useConnection((c) => [c?.authentication ?? createBaseAuthentication()]);

	const { functions, models } = useDatabaseSchema();

	const [available, setAvailable] = useState<FunctionDetails[]>([]);
	const [active, setActive] = useImmer<FunctionDetails | null>(null);
	const [isCreating, isCreatingHandle] = useDisclosure();
	const [showCreator, showCreatorHandle] = useDisclosure();
	const [createName, setCreateName] = useState("");

	const [error, setError] = useState("");

	useEffect(() => {
		const availableFunctions: FunctionDetails[] = functions.map((f) => ({
			type: "function",
			details: f,
		}));

		const availableModels: FunctionDetails[] = models.map((m) => ({
			type: "model",
			details: m,
		}));

		const sorted = [...availableFunctions, ...availableModels].sort((a, b) =>
			a.details.name.localeCompare(b.details.name),
		);

		setAvailable(sorted);
	}, [functions, models]);

	const handleSave = useSaveable({
		valid: !!active && active.details.name != null,
		track: {
			details: active,
		},
		onSave: async () => {
			if (!active) return;

			try {
				let query: string;

				if (active.type === "model") {
					query = buildModelDefinition(active.details as SchemaModel);
				} else {
					query = buildFunctionDefinition(active.details as SchemaFunction);
				}

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
				showErrorNotification({
					title: "Failed to apply schema",
					content: err,
				});
			}
		},
		onRevert({ details }) {
			setActive(details);
			setError("");
		},
	});

	const updateCreateName = useStable((e: ChangeEvent<HTMLInputElement>) => {
		const name = e.target.value.replaceAll(/\s/g, "_").replaceAll(/[^\w:]/g, "");

		setCreateName(name);
	});

	const openCreator = useRequireDatabase(() => {
		showCreatorHandle.open();
		duplicationRef.current = null;
		setCreateName("");
	});

	const editFunction = useStable(async (func: FunctionDetails) => {
		isCreatingHandle.close();

		if (func.type === "model") {
			setActive({
				type: "model",
				details: func.details,
			});
		} else {
			const f = func.details as SchemaFunction;
			const isInvalid = await getSurrealQL().validateQuery(f.block);
			const block = isInvalid ? f.block : await getSurrealQL().formatQuery(f.block);

			setActive({
				type: "function",
				details: {
					...f,
					block,
				},
			});
		}

		handleSave.track();
	});

	const createFunction = useStable(async () => {
		const duplication = duplicationRef.current?.details;

		showCreatorHandle.close();
		isCreatingHandle.open();

		setActive({
			type: "function",
			details: {
				...(duplication || {
					args: [],
					comment: "",
					block: "",
					permissions: true,
					returns: "",
				}),
				name: createName,
			},
		});

		duplicationRef.current = null;
		handleSave.track();
	});

	const duplicate = useStable((det: FunctionDetails) => {
		showCreatorHandle.open();
		duplicationRef.current = det;
		setCreateName(det.details.name);
	});

	const removeFunction = useConfirmation({
		message: "You are about to remove this function. This action cannot be undone.",
		confirmText: "Remove",
		skippable: true,
		onConfirm: async (func: FunctionDetails) => {
			await executeQuery(`REMOVE FUNCTION fn::${func.details.name}`);
			await syncConnectionSchema();

			setActive(null);
			handleSave.track();
		},
	});

	const uploadModel = useRequireDatabase(async () => {
		const files = await adapter.openBinaryFile("Select a SurrealML model", SURML_FILTERS, true);
		const { endpoint, headers } = composeHttpConnection(auth, "/ml/import", {
			Accept: "application/json",
		});

		for (const file of files) {
			await fetch(endpoint, {
				method: "POST",
				headers,
				body: file.content,
			});

			tagEvent("import", { extension: "surml" });
		}

		syncConnectionSchema();
	});

	const downloadModel = useStable(async (model: SchemaModel) => {
		const { endpoint, headers } = composeHttpConnection(
			auth,
			`/ml/export/${model.name}/${model.version}`,
		);

		await adapter.saveFile(
			"Save SurrealML model",
			`${model.name}-${model.version}.surml`,
			SURML_FILTERS,
			() =>
				fetch(endpoint, {
					method: "GET",
					headers,
				}).then((res) => res.blob()),
		);

		tagEvent("export", { extension: "surml" });
	});

	useViewFocus("functions", () => {
		syncConnectionSchema();
	});

	const [minSize, ref] = usePanelMinSize(275);

	return (
		<>
			<Box
				h="100%"
				ref={ref}
				pr="lg"
				pb="lg"
				pl={{ base: "lg", md: 0 }}
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
							active={active?.details.name || ""}
							functions={available}
							onCreate={openCreator}
							onImport={uploadModel}
							onDownload={downloadModel}
							onDelete={removeFunction}
							onDuplicate={duplicate}
							onSelect={editFunction}
						/>
					</Panel>
					<PanelDragger />
					<Panel minSize={minSize}>
						{active ? (
							active.type === "function" ? (
								<FunctionEditorPanel
									details={active.details as SchemaFunction}
									error={error}
									isCreating={isCreating}
									onChange={setActive as any}
								/>
							) : (
								<ModelPanel
									details={active.details as SchemaModel}
									onDownload={downloadModel}
								/>
							)
						) : (
							<Introduction
								title="Functions"
								icon={iconFunction}
								snippet={{
									language: "surrealql",
									title: "SurrealQL",
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
									Functions allow you to define stored procedures that can be
									reused throughout your queries. This view allows you to
									effortlessly create and manage your functions, or upload
									SurrealML models to use in your queries.
								</Text>
								<Stack>
									<Group>
										<Button
											flex={1}
											variant="gradient"
											leftSection={<Icon path={iconPlus} />}
											disabled={!isConnected}
											onClick={openCreator}
										>
											New function
										</Button>
										<Button
											flex={1}
											color="slate"
											variant="light"
											rightSection={<Icon path={iconOpen} />}
											onClick={() =>
												adapter.openUrl(
													"https://surrealdb.com/docs/surrealql/statements/define/function",
												)
											}
										>
											Learn more
										</Button>
									</Group>
								</Stack>
							</Introduction>
						)}
					</Panel>
					{active?.type === "function" && (
						<>
							<PanelDragger />
							<Panel
								maxSize={55}
								minSize={27}
								defaultSize={27}
							>
								<FunctionPropertiesPanel
									handle={handleSave}
									details={active.details as SchemaFunction}
									isCreating={isCreating}
									onChange={setActive as any}
									onDelete={removeFunction}
								/>
							</Panel>
						</>
					)}
					<SidekickPanel />
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
									c="violet"
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
