import { Box, Button, Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Icon } from "@surrealdb/ui";
import { type ChangeEvent, memo, useRef, useState } from "react";
import { Panel, PanelGroup } from "react-resizable-panels";
import { useImmer } from "use-immer";
import { adapter } from "~/adapter";
import { Form } from "~/components/Form";
import { Introduction } from "~/components/Introduction";
import { PanelDragger } from "~/components/Pane/dragger";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { SidekickPanel } from "~/components/Sidekick/panel";
import { useIsConnected, useRequireDatabase } from "~/hooks/connection";
import { usePanelMinSize } from "~/hooks/panels";
import { useViewFocus } from "~/hooks/routing";
import { useSaveable } from "~/hooks/save";
import { useDatabaseSchema } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { useConfirmation } from "~/providers/Confirmation";
import { executeQuery } from "~/screens/surrealist/connection/connection";
import type { SchemaParameter } from "~/types";
import { showErrorNotification } from "~/util/helpers";
import { iconChevronRight, iconOpen, iconPlus, iconVariable } from "~/util/icons";
import { buildParameterDefinition, syncConnectionSchema } from "~/util/schema";
import { ParameterEditorPanel } from "../ParameterEditorPanel";
import { ParameterPropertiesPanel } from "../ParameterPropertiesPanel";
import { ParametersPanel } from "../ParametersPanel";

const ParametersPanelLazy = memo(ParametersPanel);
const EditorPanelLazy = memo(ParameterEditorPanel);

export function ParametersView() {
	const isConnected = useIsConnected();
	const duplicationRef = useRef<SchemaParameter | null>(null);

	const { params } = useDatabaseSchema();

	const [details, setDetails] = useImmer<SchemaParameter | null>(null);
	const [isCreating, isCreatingHandle] = useDisclosure();
	const [showCreator, showCreatorHandle] = useDisclosure();
	const [createName, setCreateName] = useState("");

	const [error, setError] = useState("");

	const handle = useSaveable({
		valid: !!details,
		track: {
			details,
		},
		onSave: async () => {
			if (!details) return;

			const query = buildParameterDefinition(details);

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
				showErrorNotification({
					title: "Failed to apply schema",
					content: err,
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

	const openCreator = useRequireDatabase(() => {
		showCreatorHandle.open();
		duplicationRef.current = null;
		setCreateName("");
	});

	const editParameter = useStable((name: string) => {
		isCreatingHandle.close();

		const selectedParameter = params.find((p) => p.name === name) || null;

		if (!selectedParameter) {
			showErrorNotification({
				title: "Parameter not found",
				content: "The selected parameter was not found",
			});
			return;
		}

		setDetails(selectedParameter);

		handle.track();
	});

	const createParameter = useStable(async () => {
		const duplication = duplicationRef.current;

		showCreatorHandle.close();
		isCreatingHandle.open();

		setDetails({
			...(duplication || {
				comment: "",
				value: "",
				permissions: true,
			}),
			name: createName,
		});

		duplicationRef.current = null;
		handle.track();
	});

	const duplicateParameter = useStable((def: SchemaParameter) => {
		showCreatorHandle.open();
		duplicationRef.current = def;
		setCreateName(def.name);
	});

	const removeParameter = useConfirmation({
		message: "You are about to remove this parameter. This action cannot be undone.",
		confirmText: "Remove",
		skippable: true,
		onConfirm: async (name: string) => {
			await executeQuery(`REMOVE PARAM $${name}`);
			await syncConnectionSchema();

			setDetails(null);
			handle.track();
		},
	});

	useViewFocus("parameters", () => {
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
						<ParametersPanelLazy
							active={details?.name || ""}
							params={params}
							onCreate={openCreator}
							onDelete={removeParameter}
							onDuplicate={duplicateParameter}
							onSelect={editParameter}
						/>
					</Panel>
					<PanelDragger />
					<Panel minSize={minSize}>
						{details ? (
							<EditorPanelLazy
								details={details}
								error={error}
								isCreating={isCreating}
								onChange={setDetails as any}
							/>
						) : (
							<Introduction
								title="Parameters"
								icon={iconVariable}
								snippet={{
									language: "surrealql",
									title: "SurrealQL",
									code: `
										-- Define your parameters with ease
										DEFINE PARAM $hello VALUE "world";

										-- And invoke them from any query
										RETURN $hello;
									`,
								}}
							>
								<Text>
									Schema parameters allow you to define and reuse values
									throughout your queries. This view allows you to effortlessly
									create and manage your parameters.
								</Text>

								<Group>
									<Button
										flex={1}
										variant="gradient"
										leftSection={<Icon path={iconPlus} />}
										disabled={!isConnected}
										onClick={openCreator}
									>
										Create parameter
									</Button>
									<Button
										flex={1}
										color="slate"
										variant="light"
										rightSection={<Icon path={iconOpen} />}
										onClick={() =>
											adapter.openUrl(
												"https://surrealdb.com/docs/surrealql/statements/define/param",
											)
										}
									>
										Learn more
									</Button>
								</Group>
							</Introduction>
						)}
					</Panel>
					{details && (
						<>
							<PanelDragger />
							<Panel
								maxSize={55}
								minSize={27}
								defaultSize={27}
							>
								<ParameterPropertiesPanel
									handle={handle}
									details={details}
									isCreating={isCreating}
									onChange={setDetails as any}
									onDelete={removeParameter}
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
				title={<PrimaryTitle>Create new parameter</PrimaryTitle>}
			>
				<Form onSubmit={createParameter}>
					<Stack>
						<TextInput
							placeholder="parameter_name"
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
									$
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

export default ParametersView;
