import { Button, Divider, Group } from "@mantine/core";
import { useEffect, useMemo } from "react";
import { EstimatedCost } from "~/components/EstimatedCost";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { iconChevronRight } from "~/util/icons";
import { InstanceTypeSection } from "../sections/1-type";
import { ClusterStorageSection } from "../sections/2-cluster";
import { DeploymentSection } from "../sections/3-instance";
import { StepProps } from "../types";

export function ConfigureStep({
	organisation,
	details,
	backups,
	baseInstance,
	setDetails,
	setStep,
}: StepProps) {
	const showClusterStorage = details.plan === "scale" || details.plan === "enterprise";

	const checkoutDisabled = useMemo(() => {
		if (!details.name || details.name.length > 30) return true;
		if (!details.region) return true;
		if (!details.type) return true;
		if (!details.version) return true;

		if (details.backup && !details.baseInstance) return true;
		if (details.type !== "free" && !details.units) return true;

		return false;
	}, [details]);

	useEffect(() => {
		if (baseInstance) {
			setDetails((draft) => {
				draft.region = baseInstance.region;
				draft.type = baseInstance.type.slug;
				draft.version = baseInstance.version;
				draft.units = baseInstance.compute_units;
				draft.storageAmount = baseInstance.storage_size;
				draft.name = `${baseInstance.name} Copy`;
			});
		}
	}, [baseInstance, setDetails]);

	return (
		<>
			<InstanceTypeSection
				organisation={organisation}
				baseInstance={baseInstance}
				details={details}
				setDetails={setDetails}
			/>

			{showClusterStorage && (
				<ClusterStorageSection
					organisation={organisation}
					baseInstance={baseInstance}
					details={details}
					setDetails={setDetails}
				/>
			)}

			<DeploymentSection
				organisation={organisation}
				backups={backups}
				baseInstance={baseInstance}
				details={details}
				setDetails={setDetails}
			/>

			<Divider my={36} />

			<Group>
				<Button
					color="slate"
					variant="light"
					disabled={baseInstance !== undefined}
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
