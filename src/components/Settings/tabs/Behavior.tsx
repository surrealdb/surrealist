import { Button, Group, Kbd, Stack, Switch, Text } from "@mantine/core";
import { adapter } from "~/adapter";
import { useStable } from "~/hooks/stable";
import { Setting } from "../setting";
import { useConfigStore } from "~/stores/config";
import { Spacer } from "~/components/Spacer";
import { useIsLight } from "~/hooks/theme";
import { runUpdateChecker } from "~/util/updater";

const VERSION = import.meta.env.VERSION;
const AUTHOR = import.meta.env.AUTHOR;

export interface GeneralTabProps {
	onClose: () => void;
}

export function GeneralTab({ onClose }: GeneralTabProps) {
	const setTableSuggest = useConfigStore((s) => s.setTableSuggest);
	const setErrorChecking = useConfigStore((s) => s.setErrorChecking);
	const setUpdateChecker = useConfigStore((s) => s.setUpdateChecker);
	const setWindowPinned = useConfigStore((s) => s.setTableSuggest);

	const lastPromptedVersion = useConfigStore((s) => s.lastPromptedVersion);
	const updateChecker = useConfigStore((s) => s.updateChecker);
	const tableSuggest = useConfigStore((s) => s.tableSuggest);
	const errorChecking = useConfigStore((s) => s.errorChecking);
	const isPinned = useConfigStore((s) => s.isPinned);

	const isLight = useIsLight();
	
	const checkForUpdates = useStable(() => {
		runUpdateChecker(lastPromptedVersion, true);
		onClose();
	});

	const updateTableSuggest = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		setTableSuggest(e.target.checked);
	});

	const updateErrorChecking = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		setErrorChecking(e.target.checked);
	});

	const updateUpdateChecker = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		setUpdateChecker(e.target.checked);
	});

	const togglePinned = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		setWindowPinned(e.target.checked);
	});

	return (
		<Stack gap="xs">
			{adapter.isUpdateCheckSupported && (
				<Setting label="Check for updates">
					<Switch checked={updateChecker} onChange={updateUpdateChecker} />
				</Setting>
			)}

			<Setting label="Suggest table names">
				<Switch checked={tableSuggest} onChange={updateTableSuggest} />
			</Setting>

			<Setting label="Query error checking">
				<Switch checked={errorChecking} onChange={updateErrorChecking} />
			</Setting>
			

			{adapter.isPinningSupported && (
				<Setting label={<>Window always on top <Kbd size="xs">F11</Kbd></>}>
					<Switch checked={isPinned} onChange={togglePinned} />
				</Setting>
			)}

			<Group mt="xl" justify="center">
				<Text c={isLight ? "light.4" : "dark.3"}>
					Version {VERSION} by {AUTHOR}
				</Text>
				<Spacer />
				<Button variant="subtle" onClick={checkForUpdates}>
					Check for updates
				</Button>
			</Group>
		</Stack>
	);
}
