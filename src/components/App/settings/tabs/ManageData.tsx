import {
	Box,
	Button,
	Checkbox,
	Collapse,
	Group,
	MultiSelect,
	ScrollArea,
	Stack,
	Text,
} from "@mantine/core";
import { assign, isObject, merge } from "radash";

import { useMemo, useState } from "react";
import { adapter } from "~/adapter";
import { Icon } from "~/components/Icon";
import { JSON_FILTER } from "~/constants";
import { useConnectionList } from "~/hooks/connection";
import { useCheckbox } from "~/hooks/events";
import { useStable } from "~/hooks/stable";
import { useConfigStore } from "~/stores/config";
import { backupConfig } from "~/util/config";
import { showError, showInfo } from "~/util/helpers";
import { iconCheck, iconDownload, iconUpload } from "~/util/icons";
import { applyMigrations } from "~/util/migrator";

export function ManageDataTab() {
	const connections = useConnectionList();

	const [filterConnections, setFilterConnections] = useState(false);
	const [includeSensitive, setIncludeSensitive] = useState(false);
	const [filteredConnections, setFilteredConnections] = useState<string[]>([]);

	const connectionOptions = useMemo(
		() => connections.map((con) => ({ value: con.id, label: con.name })),
		[connections],
	);

	const updateFilterConnections = useCheckbox(setFilterConnections);
	const updateIncludeSensitive = useCheckbox(setIncludeSensitive);

	const saveBackup = useStable(() => {
		adapter.saveFile(
			"Save config backup",
			"surrealist-backup.json",
			[JSON_FILTER],
			async () => {
				return backupConfig({
					stripSensitive: !includeSensitive,
					connections: filteredConnections,
				});
			},
		);
	});

	const [restoreConfig, setRestoreConfig] = useState<string | null>(null);

	const restoreFile = useStable(() => {
		adapter.openTextFile("Select a backup file", [JSON_FILTER], false).then(([file]) => {
			setRestoreConfig(file.content);
		});
	});

	const applyBackup = useStable(() => {
		if (!restoreConfig) return;

		const parsed = JSON.parse(restoreConfig);

		if (typeof parsed !== "object" || typeof parsed.config !== "object") {
			showError({
				title: "Restore failed",
				content: "Invalid backup file provided",
			});
			return;
		}

		const migrated = applyMigrations(parsed.config);
		const state = assign(useConfigStore.getState(), migrated);

		useConfigStore.setState(state);
		setRestoreConfig(null);

		showInfo({
			title: "Restore successful",
			subtitle: "Your configuration has been restored",
		});
	});

	return (
		<ScrollArea
			pr="xl"
			flex={1}
			scrollbars="y"
			type="always"
		>
			<Stack
				gap="xl"
				pb={32}
			>
				<Box>
					<Text
						fw={600}
						fz={20}
						c="bright"
					>
						Backup your configuration
					</Text>
					<Stack
						align="start"
						mt="md"
					>
						<Text>
							Generate a backup of your Surrealist configuration which can be restored
							later.
							<br />
							You can customize the backup to include sensitive details or limit the
							included connections.
						</Text>
						<Checkbox
							label="Include authentication credentials"
							checked={includeSensitive}
							onChange={updateIncludeSensitive}
						/>
						<Checkbox
							label="Only include specific connections"
							checked={filterConnections}
							onChange={updateFilterConnections}
						/>
						<MultiSelect
							data={connectionOptions}
							value={filteredConnections}
							disabled={!filterConnections}
							onChange={setFilteredConnections}
							placeholder={
								filteredConnections.length === 0 ? "Select connections" : undefined
							}
							styles={{
								inputField: {
									transform: "translateY(2px)",
								},
							}}
						/>
						<Button
							px="xl"
							mt="md"
							size="xs"
							variant="gradient"
							rightSection={<Icon path={iconDownload} />}
							onClick={saveBackup}
						>
							Save backup
						</Button>
					</Stack>
				</Box>
				<Box>
					<Text
						mt="xl"
						fw={600}
						fz={20}
						c="bright"
					>
						Restore configuration
					</Text>
					<Stack
						align="start"
						mt="md"
					>
						<Text>
							Restore a previously generated backup of your Surrealist configuration.
						</Text>
						<Group>
							<Button
								px="xl"
								size="xs"
								color="slate"
								rightSection={<Icon path={iconUpload} />}
								onClick={restoreFile}
							>
								Select a backup file
							</Button>
							{restoreConfig && (
								<Button
									px="xl"
									size="xs"
									variant="gradient"
									onClick={applyBackup}
									rightSection={<Icon path={iconCheck} />}
								>
									Apply backup
								</Button>
							)}
						</Group>
					</Stack>
				</Box>
			</Stack>
		</ScrollArea>
	);
}
