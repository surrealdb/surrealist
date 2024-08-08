import { ContentPane } from "~/components/Pane";
import { ActionIcon, Badge, Group } from "@mantine/core";
import { CodeEditor } from "~/components/CodeEditor";
import { Icon } from "~/components/Icon";
import { useActiveConnection } from "~/hooks/connection";
import { useConfigStore } from "~/stores/config";
import { iconClose, iconDollar } from "~/util/icons";
import { surrealql } from "codemirror-surrealql";
import { surqlLinting } from "~/util/editor/extensions";
import { useDebouncedFunction } from "~/hooks/debounce";
import { lineNumbers } from "@codemirror/view";
import { decodeCbor } from "surrealdb.js";
import { Value } from "surrealql.wasm/v1";

export interface VariablesPaneProps {
	isValid: boolean;
	setIsValid: (isValid: boolean) => void;
	closeVariables: () => void;
}

export function VariablesPane(props: VariablesPaneProps) {
	const { updateCurrentConnection } = useConfigStore.getState();

	const connection = useActiveConnection();

	const setVariables = useDebouncedFunction((content: string | undefined) => {
		try {
			const json = content || "";
			const parsed = decodeCbor(Value.from_string(json).to_cbor().buffer);

			if (typeof parsed !== "object" || Array.isArray(parsed)) {
				throw new TypeError("Must be object");
			}

			updateCurrentConnection({
				graphqlVariables: content,
			});

			props.setIsValid(true);
		} catch {
			props.setIsValid(false);
		}
	}, 50);

	return (
		<ContentPane
			title="Variables"
			icon={iconDollar}
			rightSection={
				<Group gap="xs">
					{!props.isValid && (
						<Badge
							color="red"
							variant="light"
						>
							Invalid syntax
						</Badge>
					)}
					<ActionIcon
						color="slate"
						onClick={props.closeVariables}
						aria-label="Close variables panel"
					>
						<Icon path={iconClose} />
					</ActionIcon>
				</Group>
			}
		>
			<CodeEditor
				value={connection.graphqlVariables || ""}
				onChange={setVariables}
				extensions={[
					surrealql(),
					surqlLinting(),
					lineNumbers(),
				]}
			/>
		</ContentPane>
	);
}
