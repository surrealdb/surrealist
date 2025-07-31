import { Alert, Box, Button, Divider, Group, SimpleGrid, Stack } from "@mantine/core";
import { useMemo } from "react";
import { EstimatedCost } from "~/components/EstimatedCost";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { iconChevronRight, iconWarning } from "~/util/icons";
import { InstanceTypeSection } from "../sections/1-type";
import { StorageOptionsSection } from "../sections/2-storage";
import { ClusterOptionsSection } from "../sections/3-cluster";
import { DeploymentSection } from "../sections/4-instance";
import { StartingDataSection } from "../sections/5-start-data";
import { DataOptionsSection } from "../sections/6-data-opts";
import { StepProps } from "../types";

function WarningAlert({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<Alert
			color="red"
			mt="xl"
			mb="-1.5rem"
			title={title}
			icon={<Icon path={iconWarning} />}
		>
			{children}
		</Alert>
	);
}

export function ConfigureStep({
	organisation,
	details,
	backups,
	instances,
	setDetails,
	setStep,
}: StepProps) {
	const isNotFree = details.type !== "free";
	const showClusterOptions = details.plan === "scale" || details.plan === "enterprise";
	const regionMismatch =
		details.startingData.type === "restore" &&
		details.startingData.backupOptions?.instance &&
		details.region !== details.startingData.backupOptions.instance.region;

	const storageMismatch =
		details.startingData.backupOptions?.instance &&
		details.storageAmount < details.startingData.backupOptions.instance.storage_size;

	const restoreBlocked = !isNotFree && details.startingData.type === "restore";

	const checkoutDisabled = useMemo(() => {
		if (!details.name || details.name.length > 30) return true;
		if (!details.region) return true;
		if (!details.type) return true;
		if (!details.version) return true;

		if (isNotFree && !details.units) return true;

		if (details.startingData.type === "restore") {
			if (!details.startingData.backupOptions) return true;
			if (!details.startingData.backupOptions.instance) return true;
			if (!details.startingData.backupOptions.backup) return true;

			if (regionMismatch) return true;
			if (storageMismatch) return true;
			if (restoreBlocked) return true;
		} else if (details.startingData.type === "dataset" && !details.startingData.dataset) {
			return true;
		}

		return false;
	}, [details, isNotFree, regionMismatch, storageMismatch, restoreBlocked]);

	return (
		<>
			<InstanceTypeSection
				organisation={organisation}
				instances={instances}
				details={details}
				setDetails={setDetails}
			/>

			{regionMismatch && (
				<WarningAlert title="Region mismatch">
					When restoring from a backup, the instance must be in the same region as the
					backup
				</WarningAlert>
			)}

			{storageMismatch && (
				<WarningAlert title="Too little storage">
					You cannot have a smaller storage capacity than the instance you are restoring
					from
				</WarningAlert>
			)}

			<Box mt={36}>
				<SimpleGrid
					cols={2}
					spacing={52}
					verticalSpacing={28}
				>
					<DeploymentSection
						organisation={organisation}
						instances={instances}
						backups={backups}
						details={details}
						setDetails={setDetails}
					/>
					<StartingDataSection
						organisation={organisation}
						details={details}
						instances={instances}
						backups={backups}
						setDetails={setDetails}
					/>
					<Stack gap="xl">
						{isNotFree && (
							<StorageOptionsSection
								organisation={organisation}
								instances={instances}
								details={details}
								setDetails={setDetails}
							/>
						)}

						{showClusterOptions && (
							<ClusterOptionsSection
								organisation={organisation}
								instances={instances}
								details={details}
								setDetails={setDetails}
							/>
						)}
					</Stack>
					<DataOptionsSection
						organisation={organisation}
						backups={backups}
						details={details}
						instances={instances}
						setDetails={setDetails}
					/>
				</SimpleGrid>
			</Box>

			<Divider my={36} />

			<Group>
				<Button
					color="slate"
					variant="light"
					onClick={() => setStep(0)}
				>
					Back
				</Button>
				<Button
					type="submit"
					variant="gradient"
					disabled={checkoutDisabled}
					onClick={() => setStep(3)}
					rightSection={<Icon path={iconChevronRight} />}
				>
					Continue to checkout
				</Button>
				<Spacer />
				<EstimatedCost
					ta="right"
					organisation={organisation}
					config={details}
				/>
			</Group>
		</>
	);
}
