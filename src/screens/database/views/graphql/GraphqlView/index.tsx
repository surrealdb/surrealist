import classes from "./style.module.scss";
import clsx from "clsx";
import { QueryPane } from "../QueryPane";
import { ResultPane } from "../ResultPane";
import { VariablesPane } from "../VariablesPane";
import { memo, useState } from "react";
import { ActionIcon, Button, Center, Group, Paper, Stack } from "@mantine/core";
import { PanelGroup, Panel } from "react-resizable-panels";
import { PanelDragger } from "~/components/Pane/dragger";
import { useActiveConnection } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useKeymap } from "~/hooks/keymap";
import { Icon } from "~/components/Icon";
import { iconCursor, iconGraphql, iconOpen, iconWarning } from "~/util/icons";
import { useDatabaseStore } from "~/stores/database";
import { executeGraphql } from "~/screens/database/connection/connection";
import { useConfigStore } from "~/stores/config";
import { Introduction } from "~/components/Introduction";
import { Text } from "@mantine/core";
import { GQL_SUPPORTED } from "~/constants";
import { adapter } from "~/adapter";
import { parseValue } from "~/util/surrealql";
import { useIntent } from "~/hooks/url";
import { useIsLight } from "~/hooks/theme";

const QueryPaneLazy = memo(QueryPane);
const VariablesPaneLazy = memo(VariablesPane);
const ResultPaneLazy = memo(ResultPane);

export function GraphqlView() {
	const { updateCurrentConnection } = useConfigStore.getState();
	const { setGraphqlResponse } = useDatabaseStore.getState();

	const [variablesValid, setVariablesValid] = useState(true);
	const [queryValid, setQueryValid] = useState(true);

	const isLight = useIsLight();
	const connection = useActiveConnection();
	const activeView = useConfigStore(state => state.activeView);

	const isAvailable = GQL_SUPPORTED.has(connection.authentication.protocol);
	const isSandbox = connection.id === "sandbox";

	const [isLoading, setLoading] = useState(false);

	const runQuery = useStable(async () => {
		if (activeView !== "graphql") return;

		setLoading(true);

		try {
			const params = connection.graphqlVariables ? parseValue(connection.graphqlVariables) : {};
			const result = await executeGraphql(connection.graphqlQuery, params);

			setGraphqlResponse(connection.id, result);
		} finally {
			setLoading(false);
		}
	});

	const showVariables = connection.graphqlShowVariables;

	const setShowVariables = useStable((graphqlShowVariables: boolean) => {
		updateCurrentConnection({
			graphqlShowVariables
		});
	});

	const closeVariables = useStable(() => {
		setShowVariables(false);
	});

	const isValid = queryValid && variablesValid;

	useIntent("run-graphql-query", runQuery);
	useIntent("toggle-graphql-variables", () => setShowVariables(!showVariables));

	useKeymap([
		["F9", () => runQuery()],
		["mod+Enter", () => runQuery()],
	]);

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
								isValid={queryValid}
								showVariables={showVariables}
								setShowVariables={setShowVariables}
							/>
						</Panel>
						{showVariables && (
							<>
								<PanelDragger />
								<Panel defaultSize={40} minSize={35}>
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
								loading={isLoading}
								disabled={!isValid}
								className={clsx(classes.sendButton, isValid && classes.sendButtonValid)}
							>
								<Icon path={iconCursor} size="lg" />
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
				The GraphQL view provides a fully interactive environment for executing GraphQL queries against your database.
			</Text>
			<Group gap="sm" c="pink">
				<Icon path={iconWarning} />
				<Text>
					GraphQL is not supported {isSandbox ? 'in the sandbox' : 'by your current connection'}
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