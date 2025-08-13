import { Alert, Button, Checkbox, Group, Select, Stack, Text } from "@mantine/core";
import dayjs from "dayjs";
import { isDistributedPlan } from "~/cloud/helpers";
import { Icon } from "~/components/Icon";
import { DATASETS } from "~/constants";
import { DatasetType } from "~/types";
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

	switch (details.startingData.type) {
		case "dataset":
			return (
				<Stack gap="xl">
					<Select
						label="Dataset"
						placeholder="Select a dataset..."
						description="Select the dataset to use for your instance"
						data={Object.entries(DATASETS).map(([key, value]) => ({
							value: key,
							label: value.name,
						}))}
						value={details.startingData.datasetOptions?.id}
						onChange={(value) => {
							setDetails((draft) => {
								draft.startingData.datasetOptions = {
									id: value as DatasetType,
									addQueries: true,
								};
							});
						}}
					/>
					<Checkbox
						label="Initialize with example queries"
						checked={details.startingData.datasetOptions?.addQueries}
						onChange={(event) => {
							setDetails((draft) => {
								draft.startingData.datasetOptions = {
									id: details.startingData.datasetOptions?.id,
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
