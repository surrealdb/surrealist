import { Stack, Checkbox, NumberInput } from "@mantine/core";
import { useStable } from "~/hooks/stable";
import { store, actions } from "~/store";
import { SurrealistConfig } from "~/typings";
import { updateConfig } from "~/util/helpers";
import { Setting } from "../setting";

export interface ConnectionTabProps {
	config: SurrealistConfig;
}

export function ConnectionTab({ config }: ConnectionTabProps) {

	const setAutoConnect = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		store.dispatch(actions.setAutoConnect(e.target.checked));
		updateConfig();	
	});

	const setQueryTimeout = useStable((value: number) => {
		store.dispatch(actions.setQueryTimeout(value));
		updateConfig();
	});

	return (
		<Stack spacing="xs">
			<Setting label="Auto connect to database">
				<Checkbox
					checked={config.autoConnect}
					onChange={setAutoConnect}
				/>
			</Setting>

			<Setting label="Query timeout (seconds)">
				<NumberInput
					value={config.queryTimeout}
					min={1}
					onChange={setQueryTimeout}
				/>
			</Setting>
		</Stack>
	)
}