import { Stack, NumberInput, Switch } from "@mantine/core";
import { useStable } from "~/hooks/stable";
import { Setting } from "../setting";
import { useConfigStore } from "~/stores/config";

export function ConnectionTab() {
	const setAutoConnect = useConfigStore((s) => s.setAutoConnect);
	const setQueryTimeout = useConfigStore((s) => s.setQueryTimeout);
	
	const autoConnect = useConfigStore((s) => s.autoConnect);
	const queryTimeout = useConfigStore((s) => s.queryTimeout);
	
	const updateAutoConnect = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		setAutoConnect(e.target.checked);
	});

	const updateQueryTimeout = useStable((value: number) => {
		setQueryTimeout(value);
	});

	return (
		<Stack spacing="xs">
			<Setting label="Auto connect to database">
				<Switch checked={autoConnect} onChange={updateAutoConnect} />
			</Setting>

			<Setting label="Query timeout (seconds)">
				<NumberInput value={queryTimeout} min={1} onChange={updateQueryTimeout} />
			</Setting>
		</Stack>
	);
}
