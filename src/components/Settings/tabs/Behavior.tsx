import { Button, Group, Kbd, Stack, Switch, Text } from "@mantine/core";
import { adapter } from "~/adapter";
import { useStable } from "~/hooks/stable";
import { Setting } from "../setting";
import { useConfigStore } from "~/stores/config";
import { Spacer } from "~/components/Spacer";
import { useIsLight } from "~/hooks/theme";
import { runUpdateChecker } from "~/util/updater";
import { useCheckbox } from "~/hooks/events";

const VERSION = import.meta.env.VERSION;

export interface GeneralTabProps {
	onClose: () => void;
}

export function GeneralTab({ onClose }: GeneralTabProps) {
	const { setTableSuggest, setErrorChecking, setUpdateChecker, setWindowPinned, setAutoConnect } = useConfigStore.getState();

	const lastPromptedVersion = useConfigStore((s) => s.lastPromptedVersion);
	const updateChecker = useConfigStore((s) => s.updateChecker);
	const tableSuggest = useConfigStore((s) => s.tableSuggest);
	const errorChecking = useConfigStore((s) => s.errorChecking);
	const autoConnect = useConfigStore((s) => s.autoConnect);
	const isPinned = useConfigStore((s) => s.isPinned);

	const isLight = useIsLight();
	
	const checkForUpdates = useStable(() => {
		runUpdateChecker(lastPromptedVersion, true);
		onClose();
	});

	const updateTableSuggest = useCheckbox(setTableSuggest);
	const updateErrorChecking = useCheckbox(setErrorChecking);
	const updateUpdateChecker = useCheckbox(setUpdateChecker);
	const updateAutoConnect = useCheckbox(setAutoConnect);
	const togglePinned = useCheckbox(setWindowPinned);

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

			<Setting label="Auto connect to database">
				<Switch checked={autoConnect} onChange={updateAutoConnect} />
			</Setting>

			{adapter.isPinningSupported && (
				<Setting label={<>Window always on top <Kbd size="xs">F11</Kbd></>}>
					<Switch checked={isPinned} onChange={togglePinned} />
				</Setting>
			)}

			<Group mt="xl" justify="center">
				<Text c={isLight ? "light.4" : "dark.3"}>
					Surrealist v{VERSION}
				</Text>
				<Spacer />
				<Button variant="subtle" onClick={checkForUpdates}>
					Check for updates
				</Button>
			</Group>
		</Stack>
	);
}
