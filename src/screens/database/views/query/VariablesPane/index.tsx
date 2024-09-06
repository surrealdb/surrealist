import { lineNumbers } from "@codemirror/view";
import { ActionIcon, Badge, Group } from "@mantine/core";
import { surrealql } from "@surrealdb/codemirror";
import { Value } from "@surrealdb/ql-wasm";
import { type HtmlPortalNode, OutPortal } from "react-reverse-portal";
import { decodeCbor } from "surrealdb";
import { CodeEditor } from "~/components/CodeEditor";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { surqlLinting } from "~/editor";
import { useActiveQuery } from "~/hooks/connection";
import { useDebouncedFunction } from "~/hooks/debounce";
import { useConfigStore } from "~/stores/config";
import { iconClose, iconDollar } from "~/util/icons";

export interface VariablesPaneProps {
	isValid: boolean;
	switchPortal?: HtmlPortalNode<any>;
	square?: boolean;
	setIsValid: (isValid: boolean) => void;
	closeVariables: () => void;
}

export function VariablesPane(props: VariablesPaneProps) {
	const { updateQueryTab } = useConfigStore.getState();
	const activeTab = useActiveQuery();

	const setVariables = useDebouncedFunction((content: string | undefined) => {
		if (!activeTab) return;

		try {
			const json = content || "";
			const parsed = decodeCbor(Value.from_string(json).to_cbor().buffer);

			if (typeof parsed !== "object" || Array.isArray(parsed)) {
				throw new TypeError("Must be object");
			}

			updateQueryTab({
				id: activeTab.id,
				variables: json,
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
			radius={props.square ? 0 : undefined}
			rightSection={
				props.switchPortal ? (
					<OutPortal node={props.switchPortal} />
				) : (
					<Group gap="xs">
						{!props.isValid && (
							<Badge color="red" variant="light">
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
				)
			}
		>
			<CodeEditor
				value={activeTab?.variables || ""}
				onChange={setVariables}
				extensions={[surrealql(), surqlLinting(), lineNumbers()]}
			/>
		</ContentPane>
	);
}
