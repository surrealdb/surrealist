import { Stack, NumberInput, Switch } from "@mantine/core";
import { useStable } from "~/hooks/stable";
import { store } from "~/store";
import { SurrealistConfig } from "~/types";
import { Setting } from "../setting";
import { setAutoConnect, setQueryTimeout } from "~/stores/config";

export interface ConnectionTabProps {
	config: SurrealistConfig;
}

export function ConnectionTab({ config }: ConnectionTabProps) {
	const updateAutoConnect = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		store.dispatch(setAutoConnect(e.target.checked));
	});

	const updateQueryTimeout = useStable((value: number) => {
		store.dispatch(setQueryTimeout(value));
	});

	return (
		<Stack spacing="xs">
			<Setting label="Auto connect to database">
				<Switch checked={config.autoConnect} onChange={updateAutoConnect} />
			</Setting>

			<Setting label="Query timeout (seconds)">
				<NumberInput value={config.queryTimeout} min={1} onChange={updateQueryTimeout} />
			</Setting>
		</Stack>
	);
}
