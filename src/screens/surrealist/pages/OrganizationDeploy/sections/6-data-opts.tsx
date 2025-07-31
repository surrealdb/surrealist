import { FileInput, Select, Stack } from "@mantine/core";
import dayjs from "dayjs";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { DATASETS } from "~/constants";
import { DatasetType } from "~/types";
import { iconCloud, iconSurreal } from "~/util/icons";
import { DeploySectionProps } from "../types";

export function DataOptionsSection({
	details,
	instances,
	backups,
	setDetails,
}: DeploySectionProps) {
	if (details.startingData.type === "dataset") {
		return (
			<Stack gap="xl">
				<PrimaryTitle>Dataset options</PrimaryTitle>
				<Select
					label="Dataset"
					placeholder="Select a dataset..."
					description="Select the dataset to use for your instance"
					data={Object.entries(DATASETS).map(([key, value]) => ({
						value: key,
						label: value.name,
					}))}
					value={details.startingData.dataset}
					onChange={(value) => {
						setDetails((draft) => {
							draft.startingData.dataset = value as DatasetType | undefined;
						});
					}}
				/>
			</Stack>
		);
	} else if (details.startingData.type === "restore") {
		return (
			<Stack gap="xl">
				<PrimaryTitle>Restore options</PrimaryTitle>
				<Select
					label="Instance"
					placeholder="Select an instance..."
					description="Select the instance to restore from"
					data={instances.map((it) => ({
						value: it.id,
						label: it.name,
					}))}
					value={details.startingData.backupOptions?.instance?.id}
					onChange={(value) => {
						const instance = instances.find((it) => it.id === value);

						if (instance) {
							setDetails((draft) => {
								draft.startingData.backupOptions = {
									instance: instance,
								};
							});
						}
					}}
				/>

				{details.startingData.backupOptions?.instance && (
					<Select
						label="Backup"
						placeholder="Select a backup..."
						description="Select the backup you want to restore from"
						data={backups?.map((backup) => ({
							value: backup.snapshot_id,
							label: dayjs(backup.snapshot_started_at).format(
								"MMMM D, YYYY - hh:mm A",
							),
						}))}
						value={details.startingData.backupOptions?.backup?.snapshot_id}
						onChange={(value) => {
							const backup = backups?.find((backup) => backup.snapshot_id === value);

							if (backup) {
								setDetails((draft) => {
									draft.startingData.backupOptions = {
										instance: details.startingData.backupOptions?.instance,
										backup: backup,
									};
								});
							}
						}}
					/>
				)}
			</Stack>
		);
	} else if (details.startingData.type === "upload") {
		return (
			<Stack gap="xl">
				<PrimaryTitle>Upload options</PrimaryTitle>
				<FileInput
					label="Upload SurrealQL file"
					placeholder="Upload file"
					description="Upload a SurrealQL schema file to use for your instance"
					accept=".surql"
					leftSection={<Icon path={iconSurreal} />}
					value={details.startingData.dataFile}
					onChange={(value) => {
						setDetails((draft) => {
							draft.startingData = {
								...draft.startingData,
								dataFile: value ?? undefined,
							};
						});
					}}
				/>
				<FileInput
					label="Upload Surreal Cloud config (optional)"
					placeholder="Upload file"
					description="Automatically configure instance capabilities based on the selected config file"
					accept=".json"
					leftSection={<Icon path={iconCloud} />}
					value={details.startingData.configFile}
					onChange={(value) => {
						setDetails((draft) => {
							draft.startingData = {
								...draft.startingData,
								configFile: value ?? undefined,
							};
						});
					}}
				/>
			</Stack>
		);
	}
}
