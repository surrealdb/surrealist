import { Stack, Select, ColorScheme, Switch } from "@mantine/core";
import { adapter } from "~/adapter";
import { useStable } from "~/hooks/stable";
import { actions, store } from "~/store";
import { SurrealistConfig } from "~/types";
import { updateConfig } from "~/util/helpers";
import { Setting } from "../setting";

const THEMES = [
	{ label: 'Automatic', value: 'automatic' },
	{ label: 'Light', value: 'light' },
	{ label: 'Dark', value: 'dark' }
];

export interface GeneralTabProps {
	config: SurrealistConfig;
}

export function GeneralTab({ config }: GeneralTabProps) {

	const setColorScheme = useStable((scheme: ColorScheme) => {
		store.dispatch(actions.setColorScheme(scheme));
		updateConfig();
	});

	const setTableSuggest = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		store.dispatch(actions.setTableSuggest(e.target.checked));
		updateConfig();
	});

	const setErrorChecking = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		store.dispatch(actions.setErrorChecking(e.target.checked));
		updateConfig();
	});

	const setWordWrap = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		store.dispatch(actions.setWordWrap(e.target.checked));
		updateConfig();
	});
	
	const setTabSearch = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		store.dispatch(actions.setTabSearch(e.target.checked));
		updateConfig();
	});

	const setUpdateChecker = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		store.dispatch(actions.setUpdateChecker(e.target.checked));
		updateConfig();
	});

	return (
		<Stack spacing="xs">
			{adapter.isUpdateCheckSupported && (
				<Setting label="Check for updates">
					<Switch
						checked={config.updateChecker}
						onChange={setUpdateChecker}
					/>
				</Setting>
			)}

			<Setting label="Wrap query results">
				<Switch
					checked={config.wordWrap}
					onChange={setWordWrap}
				/>
			</Setting>

			<Setting label="Suggest table names">
				<Switch
					checked={config.tableSuggest}
					onChange={setTableSuggest}
				/>
			</Setting>

			<Setting label="Query error checking">
				<Switch
					checked={config.errorChecking}
					onChange={setErrorChecking}
				/>
			</Setting>

			<Setting label="Session search box">
				<Switch
					checked={config.tabSearch}
					onChange={setTabSearch}
				/>
			</Setting>

			<Setting label="Interface theme">
				<Select
					data={THEMES}
					value={config.theme}
					onChange={setColorScheme}
				/>
			</Setting>
		</Stack>
	);
}