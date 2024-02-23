import { ContentPane } from "~/components/Pane";
import { ActionIcon, Badge, Group } from "@mantine/core";
import { SurrealistEditor } from "~/components/SurrealistEditor";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { useActiveQuery } from "~/hooks/connection";
import { useConfigStore } from "~/stores/config";
import { tryParseParams } from "~/util/helpers";
import { iconAutoFix, iconClose, iconTune } from "~/util/icons";

const VARIABLE_PATTERN = /(?<!let\s)\$\w+/gi;

const RESERVED_VARIABLES = new Set([
	'auth',
	'token',
	'scope',
	'session',
	'before',
	'after',
	'value',
	'input',
	'this',
	'parent',
	'event',
]);

export interface VariablesPaneProps {
	isValid: boolean;
	setIsValid: (isValid: boolean) => void;
	closeVariables: () => void;
}

export function VariablesPane(props: VariablesPaneProps) {
	const { updateQueryTab } = useConfigStore.getState();
	const activeTab = useActiveQuery();

	const setVariables = useStable((content: string | undefined) => {
		try {
			const json = content || "";
			const parsed = JSON.parse(json);

			if (typeof parsed !== "object" || Array.isArray(parsed)) {
				throw new TypeError("Must be object");
			}

			updateQueryTab({
				id: activeTab!.id,
				variables: json,
			});

			props.setIsValid(true);
		} catch {
			props.setIsValid(false);
		}
	});

	const inferVariables = useStable(() => {
		if (!activeTab) return;

		const query = activeTab.query;
		const matches = query.match(VARIABLE_PATTERN) || [];

		const currentVars = tryParseParams(activeTab.variables);
		const currentKeys = Object.keys(currentVars);

		const variables = matches
			.map((v) => v.slice(1))
			.filter((v) => !RESERVED_VARIABLES.has(v) && !currentKeys.includes(v));
		
		const newVars = variables.reduce((acc, v) => {
			acc[v] = "";
			return acc;
		}, {} as Record<string, any>);

		const mergedVars = {
			...currentVars,
			...newVars
		};

		updateQueryTab({
			id: activeTab.id,
			variables: JSON.stringify(mergedVars, null, 4)
		});
	});

	return (
		<ContentPane
			title="Variables"
			icon={iconTune}
			rightSection={
				<Group gap="xs">
					{!props.isValid && (
						<Badge
							color="red"
							variant="light"
						>
							Invalid JSON
						</Badge>
					)}
					<ActionIcon
						color="slate"
						onClick={inferVariables}
						title="Infer variables from query"
					>
						<Icon path={iconAutoFix} />
					</ActionIcon>
					<ActionIcon
						color="slate"
						onClick={props.closeVariables}
						title="Close variables"
					>
						<Icon path={iconClose} />
					</ActionIcon>
				</Group>
			}
		>
			<SurrealistEditor
				language="json"
				value={activeTab?.variables || ''}
				onChange={setVariables}
				style={{
					position: "absolute",
					insetBlock: 0,
					insetInline: 24,
				}}
				options={{
					wrappingStrategy: "advanced",
					wordWrap: "on",
					suggest: {
						showProperties: false,
					}
				}}
			/>
		</ContentPane>
	);
}
