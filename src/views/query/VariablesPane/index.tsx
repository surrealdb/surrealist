import { ContentPane } from "~/components/Pane";
import { ActionIcon, Badge, Group } from "@mantine/core";
import { CodeEditor } from "~/components/CodeEditor";
import { Icon } from "~/components/Icon";
import { useActiveQuery } from "~/hooks/connection";
import { useConfigStore } from "~/stores/config";
import { iconClose, iconDollar } from "~/util/icons";
import { surrealql } from "codemirror-surrealql";
import { HtmlPortalNode, OutPortal } from "react-reverse-portal";
import { surqlLinting } from "~/util/editor/extensions";
import { useDebouncedFunction } from "~/hooks/debounce";
import { decodeCbor } from "surrealdb.js";
import { Value } from "surrealql.wasm/v1";

export interface VariablesPaneProps {
	isValid: boolean;
	switchPortal?: HtmlPortalNode<any>;
	setIsValid: (isValid: boolean) => void;
	closeVariables: () => void;
}

export function VariablesPane(props: VariablesPaneProps) {
	const { updateQueryTab } = useConfigStore.getState();
	const activeTab = useActiveQuery();

	const setVariables = useDebouncedFunction((content: string | undefined) => {
		try {
			const json = content || "";
			const parsed = decodeCbor(Value.from_string(json).to_cbor().buffer);

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
	}, 200);

	return (
		<ContentPane
			title="Variables"
			icon={iconDollar}
			rightSection={
				props.switchPortal ? (
					<OutPortal node={props.switchPortal} />
				) : (
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
				value={activeTab?.variables || ''}
				onChange={setVariables}
				extensions={[
					surrealql(),
					surqlLinting(),
				]}
			/>
		</ContentPane>
	);
}
