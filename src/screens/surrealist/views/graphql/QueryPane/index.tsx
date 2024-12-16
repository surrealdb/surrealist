import classes from "./style.module.scss";

import { ActionIcon, Alert, Badge, Button, Group, Stack, Tooltip } from "@mantine/core";

import {
	graphqlParser,
	graphqlSuggestions,
	handleFillFields,
	runGraphqlQueryKeymap,
} from "~/editor";

import {
	iconAutoFix,
	iconDollar,
	iconGraphql,
	iconOpen,
	iconRefresh,
	iconText,
} from "~/util/icons";

import { Prec } from "@codemirror/state";
import { type EditorView, keymap } from "@codemirror/view";
import { graphql, updateSchema } from "cm6-graphql";
import { type GraphQLSchema, parse, print } from "graphql";
import { ActionButton } from "~/components/ActionButton";
import { useEffect, useMemo } from "react";
import { CodeEditor } from "~/components/CodeEditor";
import { Icon } from "~/components/Icon";
import { Link } from "~/components/Link";
import { ContentPane } from "~/components/Pane";
import { useConnection } from "~/hooks/connection";
import { useDebouncedFunction } from "~/hooks/debounce";
import { useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useConfigStore } from "~/stores/config";
import { showError, showInfo, tryParseParams } from "~/util/helpers";
import { formatValue } from "~/util/surrealql";

export interface QueryPaneProps {
	showVariables: boolean;
	isValid: boolean;
	isEnabled: boolean;
	editor: EditorView | null;
	schema: GraphQLSchema | null;
	setIsValid: (isValid: boolean) => void;
	setShowVariables: (show: boolean) => void;
	onIntrospectSchema: () => Promise<void>;
	onEditorMount: (editor: EditorView) => void;
}

export function QueryPane({
	showVariables,
	isValid,
	isEnabled,
	editor,
	schema,
	setIsValid,
	setShowVariables,
	onIntrospectSchema,
	onEditorMount,
}: QueryPaneProps) {
	const { updateCurrentConnection } = useConfigStore.getState();
	const queryText = useConnection((c) => c?.graphqlQuery ?? "");

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

	const handleIntrospect = useStable(async () => {
		await onIntrospectSchema();

		showInfo({
			title: "GraphQL",
			subtitle: "Schema successfully updated",
		});
	});

	const handleFormat = useStable(() => {
		try {
			setQueryForced(print(parse(queryText)));
		} catch {
			showError({
				title: "Failed to format",
				subtitle: "Your query must be valid to format it",
			});
		}
	});

	const toggleVariables = useStable(() => {
		setShowVariables(!showVariables);
	});

	const inferVariables = useStable(() => {
		try {
			const document = parse(queryText);

			const variableNames = document.definitions.reduce((acc, def) => {
				if (def.kind === "OperationDefinition") {
					const vars = def.variableDefinitions?.map((v) => v.variable.name.value) ?? [];

					acc.push(...vars);
					return acc;
				}

				return acc;
			}, [] as string[]);

			const currentVars = tryParseParams(queryText);
			const currentKeys = Object.keys(currentVars);
			const variables = variableNames.filter((v) => !currentKeys.includes(v));

			const newVars = variables.reduce(
				(acc, v) => {
					acc[v] = "";
					return acc;
				},
				{} as Record<string, any>,
			);

			const mergedVars = {
				...currentVars,
				...newVars,
			};

			setShowVariables(true);
			updateCurrentConnection({
				graphqlVariables: formatValue(mergedVars, false, true),
			});
		} catch {
			showError({
				title: "Failed to infer variables",
				subtitle: "Your query must be valid to infer variables",
			});
		}
	});

	useEffect(() => {
		if (schema && editor) {
			updateSchema(editor, schema);
		}
	}, [schema, editor]);

	const extensions = useMemo(
		() => [
			graphql(undefined, {
				onFillAllFields: handleFillFields,
			}),
			graphqlParser(),
			// graphqlFillFields(),
			Prec.high(keymap.of([...runGraphqlQueryKeymap, ...graphqlSuggestions])),
		],
		[],
	);

	useIntent("format-graphql-query", handleFormat);
	useIntent("infer-graphql-variables", inferVariables);

	return (
		<ContentPane
			title="GraphQL"
			icon={iconGraphql}
			className={classes.root}
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

					<ActionButton
						variant="light"
						label="Refetch schema"
						onClick={handleIntrospect}
					>
						<Icon path={iconRefresh} />
					</ActionButton>

					<ActionButton
						variant="light"
						label="Format query"
						onClick={handleFormat}
					>
						<Icon path={iconText} />
					</ActionButton>

					<ActionButton
						variant="light"
						label="Infer variables from query"
						description="Automatically add missing variables."
						onClick={inferVariables}
					>
						<Icon path={iconAutoFix} />
					</ActionButton>

					<ActionButton
						variant="light"
						label={showVariables ? "Hide variables" : "Show variables"}
						onClick={toggleVariables}
					>
						<Icon path={iconDollar} />
					</ActionButton>
				</Group>
			}
		>
			{isEnabled ? (
				<CodeEditor
					value={queryText}
					onChange={scheduleSetQuery}
					onMount={onEditorMount}
					lineNumbers
					extensions={extensions}
				/>
			) : (
				<Alert
					color="red.3"
					icon={<Icon path={iconGraphql} />}
					title="GraphQL is not enabled on this remote instance"
				>
					<Stack>
						Visit the SurrealDB documentation to learn how to enable GraphQL on your
						instance
						<Link href="https://surrealdb.com/docs/surrealdb/querying/graphql/surrealist">
							<Button
								color="slate"
								variant="light"
								rightSection={<Icon path={iconOpen} />}
								radius="sm"
								size="xs"
							>
								Learn more
							</Button>
						</Link>
					</Stack>
				</Alert>
			)}
		</ContentPane>
	);
}
