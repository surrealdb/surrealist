import { Alert, Button, Group, Select, Stack, Text } from "@mantine/core";
import dayjs from "dayjs";
import { INSTANCE_PLAN_SUGGESTIONS } from "~/cloud/helpers";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { DATASETS } from "~/constants";
import { DatasetType } from "~/types";
import { iconArrowDownFat } from "~/util/icons";
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
		const isFree = details.type === "free";

		if (isFree) {
			return (
				<Stack gap={5}>
					<PrimaryTitle>Restore options</PrimaryTitle>
					<Alert
						color="violet"
						title="Upgrade required"
						icon={
							<Icon
								path={iconArrowDownFat}
								style={{ rotate: "180deg" }}
							/>
						}
					>
						<Stack gap={5}>
							<Text>You must upgrade to a paid plan to restore from a backup</Text>
							<Group mt="sm">
								<Button
									size="xs"
									variant="gradient"
									onClick={() => {
										setDetails((draft) => {
											draft.plan = "start";
											draft.type = INSTANCE_PLAN_SUGGESTIONS.start[0];
										});
									}}
								>
									Upgrade plan
								</Button>
							</Group>
						</Stack>
					</Alert>
				</Stack>
			);
		}
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

				<Select
					label="Backup"
					placeholder="Select a backup..."
					description="Select the backup you want to restore from"
					data={backups?.map((backup) => ({
						value: backup.snapshot_id,
						label: dayjs(backup.snapshot_started_at).format("MMMM D, YYYY - hh:mm A"),
					}))}
					disabled={!details.startingData.backupOptions?.instance}
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
			</Stack>
		);
	} else if (details.startingData.type === "upload") {
		return (
			<Stack gap="xl">
				<PrimaryTitle>Upload details</PrimaryTitle>
				<Text>You will be prompted to upload a file once the instance is deployed</Text>
			</Stack>
		);
	}
}
