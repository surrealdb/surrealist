import { Button } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { executeQuery } from "~/database";
import { useStable } from "~/hooks/stable";
import { TabQuery } from "~/types";
import { iconCursor, iconTune } from "~/util/icons";

export interface ActionsProps {
	queryTab: TabQuery;
	showVariables: boolean;
	toggleVariables: () => void;
}

export function Actions(props: ActionsProps) {
	const runQuery = useStable(() => {
		executeQuery();
	});

	const isInvalid = props.queryTab.queryType === "invalid";

	return (
		<>
			<Button
				size="xs"
				variant="subtle"
				onClick={props.toggleVariables}
				color="slate"
				rightSection={
					<Icon path={iconTune} />
				}
			>
				{props.showVariables ? "Hide" : "Show"} variables
			</Button>
			<Button
				size="xs"
				onClick={runQuery}
				color={isInvalid ? "red" : "surreal"}
				variant={isInvalid ? "filled" : "gradient"}
				style={{ border: "none" }}
				rightSection={
					<Icon path={iconCursor} />
				}
			>
				Run query
			</Button>
		</>
	);
}