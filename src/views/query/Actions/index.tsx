import { Button, Tooltip } from "@mantine/core";
import { mdiTuneVariant, mdiSendVariant } from "@mdi/js";
import { Icon } from "~/components/Icon";
import { executeQuery } from "~/database";
import { useStable } from "~/hooks/stable";
import { TabQuery } from "~/types";

export interface ActionsProps {
	queryTab: TabQuery;
	showVariables: boolean;
	toggleVariables: () => void;
}

export function Actions(props: ActionsProps) {
	const runQuery = useStable(() => {
		executeQuery();
	});

	return (
		<>
			<Button
				size="xs"
				variant="subtle"
				onClick={props.toggleVariables}
				color="slate"
				rightSection={
					<Icon path={mdiTuneVariant} />
				}
			>
				{props.showVariables ? "Hide" : "Show"} variables
			</Button>
			<Button
				size="xs"
				onClick={runQuery}
				color={props.queryTab.queryType === "invalid" ? "red" : "surreal"}
				rightSection={
					<Icon path={mdiSendVariant} />
				}
			>
				Run query
			</Button>
		</>
	);
}