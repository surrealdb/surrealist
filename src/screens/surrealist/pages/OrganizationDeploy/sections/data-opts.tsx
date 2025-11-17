import { Alert, Button, Checkbox, Group, Select, Stack, Text } from "@mantine/core";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { isDistributedPlan } from "~/cloud/helpers";
import { Icon } from "~/components/Icon";
import { DatasetSize, DatasetVersion } from "~/types";
import { fetchLatestCompatibleVersion, useDatasetsQuery } from "~/util/datasets";
import { iconArrowDownFat, iconHelp } from "~/util/icons";
import { DeploySectionProps } from "../types";

export function DataOptionsSection({
	details,
	instances,
	backups,
	setDetails,
	setStep,
}: DeploySectionProps) {
	const isDistributed = isDistributedPlan(details.plan);

	const restorableInstances = instances.filter((instance) => {
		return !!instance.distributed_storage_specs === isDistributed;
	});

	const { data: datasets } = useDatasetsQuery();

	const shownDatasets = datasets?.filter((dataset) => dataset.showForDeploy) ?? [];

	const [version, setVersion] = useState<DatasetVersion | undefined>(undefined);
	const [size, setSize] = useState<DatasetSize | undefined>(undefined);

	useEffect(() => {
		fetchLatestCompatibleVersion(
			details.startingData.datasetOptions?.id ?? "",
			details.version,
		).then((version) => {
			setVersion(version);
			setSize(version?.sizes?.[0]);
		});
	}, [details.startingData.datasetOptions?.id, details.version]);

	switch (details.startingData.type) {
		case "dataset":
			return (
				<Stack gap="xl">
					<Select
						label="Dataset"
						placeholder="Select a dataset..."
						description="Select the dataset to use for your instance"
						data={shownDatasets.map((dataset) => ({
							value: dataset.id,
							label: dataset.label,
						}))}
						value={details.startingData.datasetOptions?.id}
						onChange={(value) => {
							const dataset = shownDatasets.find((dataset) => dataset.id === value);

							if (dataset) {
								setDetails((draft) => {
									draft.startingData.datasetOptions = {
										id: dataset.id,
										version: dataset.versions[0].id,
										addQueries: true,
									};
								});
							}
						}}
					/>
					<Checkbox
						label="Initialize with example queries"
						checked={details.startingData.datasetOptions?.addQueries}
						onChange={(event) => {
							setDetails(async (draft) => {
								draft.startingData.datasetOptions = {
									id: details.startingData.datasetOptions?.id ?? "",
									version: version?.id ?? "",
									size: size?.id ?? "",
									addQueries: event.currentTarget.checked,
								};
							});
						}}
					/>
				</Stack>
			);
		case "restore": {
			const isFree = details.type === "free";

			return isFree ? (
				<Alert
					color="violet"
					title="Upgrade required"
					icon={
						<Icon
							path={iconArrowDownFat}
							flip="vertical"
						/>
					}
				>
					<Stack gap={5}>
						<Text>Backup restoring is only available on paid plans.</Text>
						<Group mt="sm">
							<Button
								size="xs"
								variant="gradient"
								onClick={() => {
									setStep(0);
								}}
							>
								Change plan
							</Button>
						</Group>
					</Stack>
				</Alert>
			) : (
				<Stack gap="xl">
					<Select
						label="Instance"
						placeholder="Make a selection..."
						description="Select a supported instance to restore from"
						value={details.startingData.backupOptions?.instance?.id}
						nothingFoundMessage="No instances available"
						data={restorableInstances.map((it) => ({
							value: it.id,
							label: it.name,
						}))}
						onChange={(value) => {
							const instance = restorableInstances.find((it) => it.id === value);

							if (instance) {
								setDetails((draft) => {
									draft.startingData.backupOptions = {
										instance: instance,
									};
								});
							}
						}}
					/>

					<Select
						label="Backup"
						placeholder="Select a backup..."
						description="Select the backup you want to restore from"
						disabled={!details.startingData.backupOptions?.instance}
						value={details.startingData.backupOptions?.backup?.snapshot_id}
						nothingFoundMessage="No backups available"
						data={backups?.map((backup) => ({
							value: backup.snapshot_id,
							label: dayjs(backup.snapshot_started_at).format(
								"MMMM D, YYYY - hh:mm A",
							),
						}))}
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
				</Stack>
			);
		}
		case "upload":
			return (
				<Alert
					color="violet"
					icon={<Icon path={iconHelp} />}
				>
					You will be prompted to upload a file once the instance is deployed
				</Alert>
			);
	}
}
