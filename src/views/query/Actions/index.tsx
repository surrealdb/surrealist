import { Button } from "@mantine/core";
import { mdiTuneVariant, mdiSendVariant } from "@mdi/js";
import { Icon } from "~/components/Icon";
import { executeQuery } from "~/database";
import { useStable } from "~/hooks/stable";

export interface ActionsProps {
	canQuery: boolean;
	showVariables: boolean;
	openVariables: () => void;
}

export function Actions(props: ActionsProps) {
	const runQuery = useStable(() => {
		executeQuery();
	});

	return (
		<>
			{!props.showVariables && (
				<Button
					size="xs"
					onClick={props.openVariables}
					variant="light"
					color="surreal"
					leftSection={
						<Icon path={mdiTuneVariant} />
					}
				>
					Show variables
				</Button>
			)}

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