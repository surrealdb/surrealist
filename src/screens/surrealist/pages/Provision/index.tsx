import classes from "./style.module.scss";

import { Box, ScrollArea } from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { type FC, useState } from "react";
import { useImmer } from "use-immer";
import { useOrganization } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import type { CloudInstance } from "~/types";
import { __throw, showError } from "~/util/helpers";
import { ProvisionDetailsStep } from "./steps/1_details";
import { ProvisionCategoryStep } from "./steps/2_category";
import { ProvisionInstanceTypesStep } from "./steps/3_type";
import { ProvisionComputeUnitsStep } from "./steps/4_units";
import { ProvisionFinalizeStep } from "./steps/5_finalize";
import type { ProvisionConfig, ProvisionStepProps } from "./types";
import { fetchAPI } from "~/cloud/api";
import { useAbsoluteLocation } from "~/hooks/routing";

const DEFAULT: ProvisionConfig = {
	name: "",
	region: "",
	category: "",
	type: "",
	units: 1,
	version: "",
};

const PROVISION_STEPS = [
	ProvisionDetailsStep,
	ProvisionCategoryStep,
	ProvisionInstanceTypesStep,
	ProvisionComputeUnitsStep,
	ProvisionFinalizeStep,
] satisfies FC<ProvisionStepProps>[];

export function ProvisionPage() {
	const { setProvisioning } = useCloudStore.getState();
	const [, navigate] = useAbsoluteLocation();

	const organization = useOrganization();
	const [step, setStep] = useState(0);
	const [details, setDetails] = useImmer(DEFAULT);
	const client = useQueryClient();

	const provisionInstance = useStable(async () => {
		try {
			const result = await fetchAPI<CloudInstance>("/instances", {
				method: "POST",
				body: JSON.stringify({
					name: details.name,
					org: organization?.id,
					region: details.region,
					specs: {
						slug: details.type,
						version: details.version,
						compute_units: details.type === "free" ? undefined : details.units,
					},
				}),
			});

			console.log("Provisioned instance:", result);

			setProvisioning(result);

			client.invalidateQueries({
				queryKey: ["cloud", "instances"],
			});
		} catch (err: any) {
			console.log("Failed to provision database:", [...err.response.headers.entries()]);

			showError({
				title: "Failed to provision database",
				subtitle: "Please try again later",
			});
		} finally {
			navigate("/overview");
		}
	});

	const previousStep = useStable((to?: number) => {
		if (step === 0) {
			navigate("/overview");
		} else {
			setStep(to ?? step - 1);
		}
	});

	const nextStep = useStable((to?: number) => {
		if (step === 4) {
			provisionInstance();
			return;
		}

		setStep(to ?? step + 1);
	});

	const ProvisionStep = PROVISION_STEPS[step];

	return (
		<Box
			flex={1}
			pos="relative"
		>
			<ScrollArea
				pos="absolute"
				scrollbars="y"
				type="scroll"
				inset={0}
				className={classes.scrollArea}
				viewportProps={{
					style: { paddingBottom: 75 },
				}}
			>
				<Box
					mx="auto"
					maw={600}
					pb={96}
					mt={72}
				>
					<ProvisionStep
						step={step}
						details={details}
						setDetails={setDetails}
						onPrevious={previousStep}
						onContinue={nextStep}
					/>
				</Box>
			</ScrollArea>
		</Box>
	);
}

export default ProvisionPage;
