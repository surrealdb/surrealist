import { Badge, Group } from "@mantine/core";
import { surrealql } from "@surrealdb/codemirror";
import { Value } from "@surrealdb/ql-wasm";
import { decodeCbor } from "surrealdb";
import { ActionButton } from "~/components/ActionButton";
import { CodeEditor } from "~/components/CodeEditor";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { surqlLinting } from "~/editor";
import { useActiveConnection } from "~/hooks/connection";
import { useDebouncedFunction } from "~/hooks/debounce";
import { useConfigStore } from "~/stores/config";
import { iconClose, iconDollar } from "~/util/icons";

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
					<ActionButton
						color="slate"
						label="Close panel"
						onClick={props.closeVariables}
					>
						<Icon path={iconClose} />
					</ActionButton>
				</Group>
			}
		>
			<CodeEditor
				value={connection.graphqlVariables || ""}
				onChange={setVariables}
				lineNumbers
				extensions={[surrealql(), surqlLinting()]}
			/>
		</ContentPane>
	);
}
