import { Alert, AlertProps, Box, Button, Divider, Group, SimpleGrid, Stack } from "@mantine/core";
import { Icon } from "@surrealdb/ui";
import { useMemo } from "react";
import { EstimatedCost } from "~/components/EstimatedCost";
import { Spacer } from "~/components/Spacer";
import { iconChevronRight, iconWarning } from "~/util/icons";
import { ClusterOptionsSection } from "../sections/cluster";
import { DataOptionsSection } from "../sections/data-opts";
import { DeploymentSection } from "../sections/instance";
import { StartingDataSection } from "../sections/start-data";
import { StorageOptionsSection } from "../sections/storage";
import { InstanceTypeSection } from "../sections/type";
import { StepProps } from "../types";

interface WarningAlertProps extends AlertProps {
	title: string;
}

function WarningAlert({ title, children, ...other }: WarningAlertProps) {
	return (
		<Alert
			color="red"
			mt="xl"
			mb="-1.5rem"
			title={title}
			icon={<Icon path={iconWarning} />}
			{...other}
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
	const isNotFree = details.computeType !== "free";
	const isDedicated = details.plan === "enterprise";
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
		if (!details.computeType) return true;
		if (!details.version) return true;

		if (isNotFree && !details.computeUnits) return true;

		if (details.startingData.type === "restore") {
			if (!details.startingData.backupOptions) return true;
			if (!details.startingData.backupOptions.instance) return true;
			if (!details.startingData.backupOptions.backup) return true;

			if (regionMismatch) return true;
			if (storageMismatch) return true;
			if (restoreBlocked) return true;
		}

		if (details.plan === "enterprise") {
			if (!details.computeUnits) return true;
			if (!details.storageType) return true;
			if (!details.storageUnits) return true;
			if (!details.storageAmount) return true;
		}

		return false;
	}, [details, isNotFree, regionMismatch, storageMismatch, restoreBlocked]);

	return (
		<>
			{isDedicated ? (
				<ClusterOptionsSection
					organisation={organisation}
					instances={instances}
					details={details}
					setDetails={setDetails}
					setStep={setStep}
				/>
			) : (
				<InstanceTypeSection
					organisation={organisation}
					instances={instances}
					details={details}
					setDetails={setDetails}
					setStep={setStep}
				/>
			)}

			<Divider my={36} />

			{regionMismatch && (
				<WarningAlert
					title="Region mismatch"
					mb="xl"
				>
					When restoring from a backup, the instance must be in the same region as the
					backup
				</WarningAlert>
			)}

			{storageMismatch && (
				<WarningAlert
					title="Too little storage"
					mb="xl"
				>
					You cannot have a smaller storage capacity than the instance you are restoring
					from
				</WarningAlert>
			)}

			<Box>
				<SimpleGrid
					spacing={{ base: 36, xl: 64 }}
					cols={{ base: 1, xl: 2 }}
				>
					<Stack gap={36}>
						<DeploymentSection
							organisation={organisation}
							instances={instances}
							backups={backups}
							details={details}
							setDetails={setDetails}
							setStep={setStep}
						/>

						{isNotFree && !isDedicated && (
							<StorageOptionsSection
								organisation={organisation}
								instances={instances}
								details={details}
								setDetails={setDetails}
								setStep={setStep}
							/>
						)}
					</Stack>
					<Stack gap={36}>
						<StartingDataSection
							organisation={organisation}
							details={details}
							instances={instances}
							backups={backups}
							setDetails={setDetails}
							setStep={setStep}
						/>
						<DataOptionsSection
							organisation={organisation}
							backups={backups}
							details={details}
							instances={instances}
							setDetails={setDetails}
							setStep={setStep}
						/>
					</Stack>
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
				{!isDedicated && (
					<EstimatedCost
						ta="right"
						organisation={organisation}
						config={details}
					/>
				)}
			</Group>
		</>
	);
}
