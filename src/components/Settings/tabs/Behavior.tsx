import { Kbd, Stack, Switch } from "@mantine/core";
import { adapter } from "~/adapter";
import { useStable } from "~/hooks/stable";
import { actions, store } from "~/store";
import { SurrealistConfig } from "~/types";
import { updateConfig } from "~/util/helpers";
import { Setting } from "../setting";

export interface GeneralTabProps {
	config: SurrealistConfig;
}

export function GeneralTab({ config }: GeneralTabProps) {

	const setTableSuggest = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		store.dispatch(actions.setTableSuggest(e.target.checked));
		updateConfig();
	});

	const setErrorChecking = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		store.dispatch(actions.setErrorChecking(e.target.checked));
		updateConfig();
	});

	const setUpdateChecker = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		store.dispatch(actions.setUpdateChecker(e.target.checked));
		updateConfig();
	});

	const togglePinned = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		store.dispatch(actions.setWindowPinned(e.target.checked));
		updateConfig();
	});

	return (
		<Stack spacing="xs">
			{adapter.isUpdateCheckSupported && (
				<Setting label="Check for updates">
					<Switch checked={config.updateChecker} onChange={setUpdateChecker} />
				</Setting>
			)}

			<Setting label="Suggest table names">
				<Switch checked={config.tableSuggest} onChange={setTableSuggest} />
			</Setting>

			<Setting label="Query error checking">
				<Switch checked={config.errorChecking} onChange={setErrorChecking} />
			</Setting>
			

			{adapter.isPinningSupported && (
				<Setting label={<>Window always on top <Kbd size="xs">F11</Kbd></>}>
					<Switch checked={config.isPinned} onChange={togglePinned} />
				</Setting>
			)}
		</Stack>
	);
}
