import { ContentPane } from "~/components/Pane";
import { ActionIcon, Badge, Group } from "@mantine/core";
import { SurrealistEditor } from "~/components/SurrealistEditor";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { useActiveQuery } from "~/hooks/connection";
import { useConfigStore } from "~/stores/config";
import { iconClose, iconTune } from "~/util/icons";
import { json } from "@codemirror/lang-json";
import { HtmlPortalNode, OutPortal } from "react-reverse-portal";

export interface VariablesPaneProps {
	isValid: boolean;
	switchPortal?: HtmlPortalNode<any>;
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

	return (
		<ContentPane
			title="Variables"
			icon={iconTune}
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
						>
							<Icon path={iconClose} />
						</ActionIcon>
					</Group>
				)
			}
		>
			<SurrealistEditor
				language="json"
				value={activeTab?.variables || ''}
				onChange={setVariables}
				options={{
					wrappingStrategy: "advanced",
					wordWrap: "on",
					suggest: {
						showProperties: false,
					}
				}}
				extensions={[
					json()
				]}
			/>
		</ContentPane>
	);
}
