import { Button, Divider, Group } from "@mantine/core";
import { useMemo } from "react";
import { EstimatedCost } from "~/components/EstimatedCost";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { iconChevronRight } from "~/util/icons";
import { InstanceTypeSection } from "../sections/1-type";
import { ClusterStorageSection } from "../sections/2-cluster";
import { DeploymentSection } from "../sections/3-instance";
import { StepProps } from "../types";

export function ConfigureStep({ organisation, details, setDetails, setStep }: StepProps) {
	const checkoutDisabled = useMemo(() => {
		if (!details.name || details.name.length > 30) return true;
		if (!details.region) return true;
		if (!details.type) return true;
		if (!details.version) return true;

		if (details.type !== "free" && !details.units) return true;

		return false;
	}, [details]);

	return (
		<>
			<InstanceTypeSection
				organisation={organisation}
				details={details}
				setDetails={setDetails}
			/>

			<ClusterStorageSection
				organisation={organisation}
				details={details}
				setDetails={setDetails}
			/>

			<DeploymentSection
				organisation={organisation}
				details={details}
				setDetails={setDetails}
			/>

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
