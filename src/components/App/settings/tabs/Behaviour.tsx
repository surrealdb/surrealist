import { Checkbox, Kbd, NumberInput } from "@mantine/core";
import { isDesktop } from "~/adapter";
import { useSetting } from "~/hooks/config";
import { useCheckbox } from "~/hooks/events";
import { useStable } from "~/hooks/stable";
import { SettingsSection } from "../utilities";

const CAT = "behavior";

export function BehaviourTab() {
	// const [updateChecker, setUpdateChecker] = useSetting(CAT, "updateChecker");
	const [tableSuggest, setTableSuggest] = useSetting(CAT, "tableSuggest");
	const [variableSuggest, setVariableSuggest] = useSetting(
		CAT,
		"variableSuggest",
	);
	const [queryErrorChecker, setQueryErrorChecker] = useSetting(
		CAT,
		"queryErrorChecker",
	);
	const [windowPinned, setWindowPinned] = useSetting(CAT, "windowPinned");
	const [reconnectInterval, setReconnectInterval] = useSetting(
		CAT,
		"reconnectInterval",
	);
	const [versionCheckTimeout, setVersionCheckTimeout] = useSetting(
		CAT,
		"versionCheckTimeout",
	);

	// const updateUpdateChecker = useCheckbox(setUpdateChecker);
	const updateTableSuggest = useCheckbox(setTableSuggest);
	const updateVariableSuggest = useCheckbox(setVariableSuggest);
	const updateQueryErrorChecker = useCheckbox(setQueryErrorChecker);
	const updateWindowPinned = useCheckbox(setWindowPinned);

	const updateVersionCheckTimeout = useStable((v: string | number) =>
		setVersionCheckTimeout(+v),
	);
	const updateReconnectInterval = useStable((v: string | number) =>
		setReconnectInterval(+v),
	);

	return (
		<>
			{isDesktop && (
				<SettingsSection>
					{/* {adapter.isUpdateCheckSupported && (
						<Checkbox
							label="Always check for updates"
							checked={updateChecker}
							onChange={updateUpdateChecker}
						/>
					)} */}
					<Checkbox
						label={
							<>
								Always on top <Kbd size="xs">F10</Kbd>
							</>
						}
						checked={windowPinned}
						onChange={updateWindowPinned}
					/>
				</SettingsSection>
			)}

			<SettingsSection label="Query view">
				<Checkbox
					label="Auto complete table names"
					checked={tableSuggest}
					onChange={updateTableSuggest}
				/>

				<Checkbox
					label="Auto complete configured variables"
					checked={variableSuggest}
					onChange={updateVariableSuggest}
				/>

				<Checkbox
					label="Validate query for errors"
					checked={queryErrorChecker}
					onChange={updateQueryErrorChecker}
				/>
			</SettingsSection>

			<SettingsSection label="Connection">
				<NumberInput
					label="Version check timeout"
					placeholder="Seconds"
					value={versionCheckTimeout}
					onChange={updateVersionCheckTimeout}
					min={1}
				/>

				<NumberInput
					label="Reconnect interval"
					placeholder="Seconds"
					value={reconnectInterval}
					onChange={updateReconnectInterval}
					min={1}
				/>
			</SettingsSection>
		</>
	);
}
