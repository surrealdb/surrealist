import { useStable } from "~/hooks/stable";
import { ContentPane } from "~/components/Pane";
import { useDebouncedFunction } from "~/hooks/debounce";
import { CodeEditor } from "~/components/CodeEditor";
import { ActionIcon, Badge, Group, Stack, Tooltip } from "@mantine/core";
import { useConfigStore } from '~/stores/config';
import { iconAutoFix, iconDollar, iconText } from "~/util/icons";
import { Icon } from "~/components/Icon";
import { showError, tryParseParams } from "~/util/helpers";
import { Text } from "@mantine/core";
import { mdiGraphql } from "@mdi/js";
import { graphql } from 'cm6-graphql';
import { useActiveConnection } from "~/hooks/connection";
import { parse, print } from "graphql";
import { graphqlParser } from "~/util/editor/extensions";
import { lineNumbers } from "@codemirror/view";
import { formatValue } from "~/util/surrealql";
import { useIntent } from "~/hooks/url";

export interface QueryPaneProps {
	showVariables: boolean;
	isValid: boolean;
	setIsValid: (isValid: boolean) => void;
	setShowVariables: (show: boolean) => void;
}

export function QueryPane({
	showVariables,
	isValid,
	setIsValid,
	setShowVariables,
}: QueryPaneProps) {
	const { updateCurrentConnection } = useConfigStore.getState();
	const connection = useActiveConnection();

	const setQueryForced = useStable((query: string) => {
		try {
			parse(query);
			setIsValid(true);
			updateCurrentConnection({
				graphqlQuery: query,
			});
		} catch {
			setIsValid(false);
		}
	});

	const scheduleSetQuery = useDebouncedFunction(setQueryForced, 50);

	const handleFormat = useStable(() => {
		try {
			setQueryForced(print(parse(connection.graphqlQuery)));
		} catch {
			showError({
				title: "Failed to format",
				subtitle: "Your query must be valid to format it"
			});
		}
	});

	const toggleVariables = useStable(() => {
		setShowVariables(!showVariables);
	});

	const inferVariables = useStable(() => {
		try {
			const document = parse(connection.graphqlQuery);

			const variableNames = document.definitions.reduce((acc, def) => {
				if (def.kind === "OperationDefinition") {
					const vars = def.variableDefinitions?.map((v) => v.variable.name.value) ?? [];

					return [...acc, ...vars];
				}

				return acc;
			}, [] as string[]);

			const currentVars = tryParseParams(connection.graphqlQuery);
			const currentKeys = Object.keys(currentVars);
			const variables = variableNames.filter((v) => !currentKeys.includes(v));

			const newVars = variables.reduce((acc, v) => {
				acc[v] = "";
				return acc;
			}, {} as Record<string, any>);

			const mergedVars = {
				...currentVars,
				...newVars
			};

			setShowVariables(true);
			updateCurrentConnection({
				graphqlVariables: formatValue(mergedVars, false, true),
			});
		} catch {
			showError({
				title: "Failed to infer variables",
				subtitle: "Your query must be valid to infer variables"
			});
		}
	});

	useIntent("format-graphql-query", handleFormat);
	useIntent("infer-graphql-variables", inferVariables);

	return (
		<ContentPane
			title="GraphQL"
			icon={mdiGraphql}
			rightSection={
				<Group gap="sm">
					{!isValid && (
						<Badge
							color="red"
							variant="light"
						>
							Invalid query
						</Badge>
					)}

					<Tooltip label="Format query">
						<ActionIcon
							onClick={handleFormat}
							variant="light"
							aria-label="Format query"
						>
							<Icon path={iconText} />
						</ActionIcon>
					</Tooltip>

					<Tooltip maw={175} multiline label={
						<Stack gap={4}>
							<Text>Infer variables from query</Text>
							<Text c="dimmed" size="sm">
								Automatically add missing variables.
							</Text>
						</Stack>
					}>
						<ActionIcon
							onClick={inferVariables}
							variant="light"
							aria-label="Infer variables from query"
						>
							<Icon path={iconAutoFix} />
						</ActionIcon>
					</Tooltip>

					<Tooltip label={showVariables ? "Hide variables" : "Show variables"}>
						<ActionIcon
							onClick={toggleVariables}
							variant="light"
							aria-label={showVariables ? "Hide variables" : "Show variables"}
						>
							<Icon path={iconDollar} />
						</ActionIcon>
					</Tooltip>
				</Group>
			}
		>
			<CodeEditor
				value={connection.graphqlQuery}
				onChange={scheduleSetQuery}
				extensions={[
					graphql(),
					graphqlParser(),
					lineNumbers(),
				]}
			/>
		</ContentPane>
	);
}
