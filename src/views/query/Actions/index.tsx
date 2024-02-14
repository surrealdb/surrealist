import { Button } from "@mantine/core";
import { mdiTuneVariant, mdiSendVariant } from "@mdi/js";
import { Icon } from "~/components/Icon";
import { executeQuery } from "~/database";
import { useStable } from "~/hooks/stable";

export interface ActionsProps {
	canQuery: boolean;
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
				color={props.canQuery ? "surreal" : "red"}
				rightSection={
					<Icon path={mdiSendVariant} />
				}
			>
				Run query
			</Button>
		</>
	);
}