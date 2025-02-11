import { Badge, Group } from "@mantine/core";
import { surrealql } from "@surrealdb/codemirror";
import { Value } from "@surrealdb/ql-wasm";
import { useMemo } from "react";
import { decodeCbor } from "surrealdb";
import { ActionButton } from "~/components/ActionButton";
import { CodeEditor } from "~/components/CodeEditor";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { surqlLinting } from "~/editor";
import { useConnection } from "~/hooks/connection";
import { useDebouncedFunction } from "~/hooks/debounce";
import { useActiveConnection } from "~/hooks/routing";
import { useConfigStore } from "~/stores/config";
import { iconClose, iconDollar } from "~/util/icons";

export interface VariablesPaneProps {
	isValid: boolean;
	setIsValid: (isValid: boolean) => void;
	closeVariables: () => void;
}

export function VariablesPane(props: VariablesPaneProps) {
	const { updateConnection } = useConfigStore.getState();
	const [connection] = useActiveConnection();
	const variablesText = useConnection((c) => c?.graphqlVariables ?? "");

	const setVariables = useDebouncedFunction((content: string | undefined) => {
		if (!connection) return;

		try {
			const json = content || "";
			const parsed = decodeCbor(Value.from_string(json).to_cbor().buffer);

			if (typeof parsed !== "object" || Array.isArray(parsed)) {
				throw new TypeError("Must be object");
			}

			updateConnection({
				id: connection,
				graphqlVariables: content,
			});

			props.setIsValid(true);
		} catch {
			props.setIsValid(false);
		}
	}, 50);

	const extensions = useMemo(() => [surrealql(), surqlLinting()], []);

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
				value={variablesText}
				onChange={setVariables}
				lineNumbers
				extensions={extensions}
			/>
		</ContentPane>
	);
}
