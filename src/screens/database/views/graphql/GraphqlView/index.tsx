import type { EditorView } from "@codemirror/view";
import { ActionIcon, Button, Center, Group, Paper, Stack } from "@mantine/core";
import { Text } from "@mantine/core";
import clsx from "clsx";
import { memo, useState } from "react";
import { Panel, PanelGroup } from "react-resizable-panels";
import { adapter } from "~/adapter";
import { Icon } from "~/components/Icon";
import { Introduction } from "~/components/Introduction";
import { PanelDragger } from "~/components/Pane/dragger";
import { GQL_SUPPORTED } from "~/constants";
import { executeGraphqlEditorQuery } from "~/editor/query";
import { useActiveConnection, useIsConnected } from "~/hooks/connection";
import { useGraphqlIntrospection } from "~/hooks/graphql";
import { useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useViewEffect } from "~/hooks/view";
import { checkGraphqlSupport } from "~/screens/database/connection/connection";
import { useConfigStore } from "~/stores/config";
import { useDatabaseStore } from "~/stores/database";
import { iconCursor, iconGraphql, iconOpen, iconWarning } from "~/util/icons";
import { QueryPane } from "../QueryPane";
import { ResultPane } from "../ResultPane";
import { VariablesPane } from "../VariablesPane";
import classes from "./style.module.scss";

const QueryPaneLazy = memo(QueryPane);
const VariablesPaneLazy = memo(VariablesPane);
const ResultPaneLazy = memo(ResultPane);

export function GraphqlView() {
	const { updateCurrentConnection } = useConfigStore.getState();

	const isActive = useDatabaseStore((s) => s.isGraphqlQueryActive);

	const [isEnabled, setEnabled] = useState(false);
	const [variablesValid, setVariablesValid] = useState(true);
	const [queryValid, setQueryValid] = useState(true);
	const [editor, setEditor] = useState<EditorView | null>(null);

	const isLight = useIsLight();
	const isConnected = useIsConnected();
	const connection = useActiveConnection();
	const [schema, introspectSchema] = useGraphqlIntrospection();

	const isAvailable = GQL_SUPPORTED.has(connection.authentication.protocol);
	const isSandbox = connection.id === "sandbox";
	const showVariables = connection.graphqlShowVariables;

	const runQuery = useStable(() => {
		if (editor) {
			executeGraphqlEditorQuery(editor);
		}
	});

	const setShowVariables = useStable((graphqlShowVariables: boolean) => {
		updateCurrentConnection({
			graphqlShowVariables,
		});
	});

	const closeVariables = useStable(() => {
		setShowVariables(false);
	});

	const isValid = queryValid && variablesValid && isEnabled;

	useViewEffect(
		"graphql",
		() => {
			if (isAvailable && isConnected) {
				checkGraphqlSupport().then((supported) => {
					setEnabled(supported);

					if (supported) {
						introspectSchema();
					}
				});
			} else {
				setEnabled(true);
			}
		},
		[connection.id, isConnected],
	);

	useIntent("run-graphql-query", () => {});
	useIntent("toggle-graphql-variables", () => setShowVariables(!showVariables));

	return isAvailable ? (
		<Stack
			gap="md"
			h="100%"
		>
			<PanelGroup direction="horizontal">
				<Panel minSize={15}>
					<PanelGroup direction="vertical">
						<Panel minSize={35}>
							<QueryPaneLazy
								setIsValid={setQueryValid}
								isEnabled={isEnabled}
								isValid={queryValid}
								editor={editor}
								schema={schema}
								showVariables={showVariables}
								setShowVariables={setShowVariables}
								onIntrospectSchema={introspectSchema}
								onEditorMount={setEditor}
							/>
						</Panel>
						{showVariables && (
							<>
								<PanelDragger />
								<Panel
									defaultSize={40}
									minSize={35}
								>
									<VariablesPaneLazy
										isValid={variablesValid}
										setIsValid={setVariablesValid}
										closeVariables={closeVariables}
									/>
								</Panel>
							</>
						)}
					</PanelGroup>
				</Panel>
				<PanelDragger>
					<Center
						pos="relative"
						h="100%"
					>
						<Paper
							className={classes.sendCircle}
							bg={isLight ? "slate.0" : "slate.9"}
							pos="absolute"
							radius={100}
							p="xs"
						>
							<ActionIcon
								variant={isValid ? "gradient" : undefined}
								size="xl"
								radius={100}
								onClick={runQuery}
								loading={isActive}
								disabled={!isValid}
								className={clsx(
									classes.sendButton,
									isValid && classes.sendButtonValid,
								)}
							>
								<Icon
									path={iconCursor}
									size="lg"
								/>
							</ActionIcon>
						</Paper>
					</Center>
				</PanelDragger>
				<Panel minSize={15}>
					<ResultPaneLazy />
				</Panel>
			</PanelGroup>
		</Stack>
	) : (
		<Introduction
			title="GraphQL"
			icon={iconGraphql}
		>
			<Text>
				The GraphQL view provides a fully interactive environment for executing GraphQL
				queries against your database.
			</Text>
			<Group
				gap="sm"
				c="pink"
			>
				<Icon path={iconWarning} />
				<Text>
					GraphQL is not supported{" "}
					{isSandbox ? "in the sandbox" : "by your current connection"}
				</Text>
			</Group>
			<Button
				color="slate"
				variant="light"
				rightSection={<Icon path={iconOpen} />}
				onClick={() => adapter.openUrl("https://surrealdb.com/docs/surrealist")}
			>
				Learn more
			</Button>
		</Introduction>
	);
}

export default GraphqlView;
