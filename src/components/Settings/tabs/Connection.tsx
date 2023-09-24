import { Stack, NumberInput, Switch } from "@mantine/core";
import { useStable } from "~/hooks/stable";
import { store, actions } from "~/store";
import { SurrealistConfig } from "~/types";
import { Setting } from "../setting";

export interface ConnectionTabProps {
	config: SurrealistConfig;
}

export function ConnectionTab({ config }: ConnectionTabProps) {
	const setAutoConnect = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		store.dispatch(actions.setAutoConnect(e.target.checked));
	});

	const setQueryTimeout = useStable((value: number) => {
		store.dispatch(actions.setQueryTimeout(value));
	});

	return (
		<Stack spacing="xs">
			<Setting label="Auto connect to database">
				<Switch checked={config.autoConnect} onChange={setAutoConnect} />
			</Setting>

			<Setting label="Query timeout (seconds)">
				<NumberInput value={config.queryTimeout} min={1} onChange={setQueryTimeout} />
			</Setting>
		</Stack>
	);
}
