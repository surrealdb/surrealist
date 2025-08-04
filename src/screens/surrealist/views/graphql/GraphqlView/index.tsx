import type { EditorView } from "@codemirror/view";
import { ActionIcon, Button, Center, Group, Paper, Stack, Text } from "@mantine/core";
import clsx from "clsx";
import { memo, useMemo, useState } from "react";
import { Panel, PanelGroup } from "react-resizable-panels";
import { adapter } from "~/adapter";
import { Icon } from "~/components/Icon";
import { Introduction } from "~/components/Introduction";
import { PanelDragger } from "~/components/Pane/dragger";
import { SidekickPanel } from "~/components/Sidekick/panel";
import { GQL_SUPPORTED } from "~/constants";
import { executeGraphqlEditorQuery } from "~/editor/query";
import { useConnection, useIsConnected } from "~/hooks/connection";
import { useGraphqlIntrospection } from "~/hooks/graphql";
import { useConnectionAndView, useIntent, useViewFocus } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { checkGraphqlSupport } from "~/screens/surrealist/connection/connection";
import { useConfigStore } from "~/stores/config";
import { useDatabaseStore } from "~/stores/database";
import { createBaseAuthentication } from "~/util/defaults";
import { iconCursor, iconGraphql, iconOpen, iconWarning } from "~/util/icons";
import { QueryPane } from "../QueryPane";
import { ResultPane } from "../ResultPane";
import { VariablesPane } from "../VariablesPane";
import classes from "./style.module.scss";

const QueryPaneLazy = memo(QueryPane);
const VariablesPaneLazy = memo(VariablesPane);
const ResultPaneLazy = memo(ResultPane);

export function GraphqlView() {
	const { updateConnection } = useConfigStore.getState();

	const isActive = useDatabaseStore((s) => s.isGraphqlQueryActive);

	const [connection] = useConnectionAndView();
	const [isEnabled, setEnabled] = useState(false);
	const [variablesValid, setVariablesValid] = useState(true);
	const [queryValid, setQueryValid] = useState(true);
	const [editor, setEditor] = useState<EditorView | null>(null);

	const isLight = useIsLight();
	const isConnected = useIsConnected();
	const [schema, introspectSchema] = useGraphqlIntrospection();

	const [id, showVariables, namespace, database, authentication] = useConnection((c) => [
		c?.id ?? "",
		c?.graphqlShowVariables ?? false,
		c?.lastNamespace ?? "",
		c?.lastDatabase ?? "",
		c?.authentication ?? createBaseAuthentication(),
	]);

	const isAvailable = GQL_SUPPORTED.has(authentication.protocol);
	const isSandbox = id === "sandbox";

	const runQuery = useStable(() => {
		if (editor) {
			executeGraphqlEditorQuery(editor);
		}
	});

	const setShowVariables = useStable((graphqlShowVariables: boolean) => {
		if (!connection) return;

		updateConnection({
			id: connection,
			graphqlShowVariables,
		});
	});

	const closeVariables = useStable(() => {
		setShowVariables(false);
	});

	const isValid = queryValid && variablesValid && isEnabled;

	const snippet = useMemo(
		() => ({
			language: "bash",
			title: "Using cURL",
			code: `
			# Execute a curl request
			curl -X POST -u "root:root" \\
				-H "Surreal-NS: ${namespace}" \\
				-H "Surreal-DB: ${database}" \\
				-H "Accept: application/json" \\
				-d '{"query": "{ person(filter: {age: {age_gt: 18}}) { id name age } }"}' \\
				http://surrealdb.example.com/graphql
		`,
		}),
		[namespace, database],
	);

	useViewFocus("graphql", () => {
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
	}, [id, isConnected]);

	useIntent("run-graphql-query", () => {});
	useIntent("toggle-graphql-variables", () => setShowVariables(!showVariables));

	return isAvailable ? (
		<Stack
			gap="md"
			h="100%"
			pr="lg"
			pb="lg"
			pl={{ base: "lg", md: 0 }}
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
				<SidekickPanel />
			</PanelGroup>
		</Stack>
	) : (
		<Introduction
			title="GraphQL"
			icon={iconGraphql}
			snippet={snippet}
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
				onClick={() =>
					adapter.openUrl("https://surrealdb.com/docs/surrealdb/querying/graphql")
				}
			>
				Learn more
			</Button>
		</Introduction>
	);
}

export default GraphqlView;
