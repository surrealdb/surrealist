import { mdiClose, mdiTuneVariant } from "@mdi/js";
import { useStable } from "~/hooks/stable";
import { useActiveQuery } from "~/hooks/connection";
import { Panel } from "~/components/Panel";
import { useState } from "react";
import { ActionIcon, Group, Text } from "@mantine/core";
import { SurrealistEditor } from "~/components/SurrealistEditor";
import { useConfigStore } from "~/stores/config";
import { Icon } from "~/components/Icon";

export interface VariablesPaneProps {
	closeVariables: () => void;
}

export function VariablesPane(props: VariablesPaneProps) {
	const updateQueryTab = useConfigStore((s) => s.updateQueryTab);
	const activeTab = useActiveQuery();

	const [isInvalid, setIsInvalid] = useState(false);

	const setVariables = useStable((content: string | undefined) => {
		try {
			const json = content || "{}";
			const parsed = JSON.parse(json);

			if (typeof parsed !== "object" || Array.isArray(parsed)) {
				throw new TypeError("Invalid JSON");
			}

			updateQueryTab({
				id: activeTab!.id,
				variables: json,
			});

			setIsInvalid(false);
		} catch {
			setIsInvalid(true);
		}
	});

	const jsonAlert = isInvalid ? <Text c="red">Invalid variable JSON</Text> : undefined;

	return (
		<Panel
			title="Variables"
			icon={mdiTuneVariant}
			rightSection={
				<Group>
					{jsonAlert}
					<ActionIcon
						color="slate"
						onClick={props.closeVariables}
						title="Close variables"
					>
						<Icon path={mdiClose} />
					</ActionIcon>
				</Group>
			}
		>
			<SurrealistEditor
				language="json"
				value={activeTab?.variables}
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
		</Panel>
	);
}
