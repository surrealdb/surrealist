import classes from "./style.module.scss";

import { Box, ScrollArea } from "@mantine/core";
import { type FC, useState } from "react";
import { useImmer } from "use-immer";
import { useOrganization } from "~/hooks/cloud";
import { useActiveCloudPage, useCloudPageFocus } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import { useConfigStore } from "~/stores/config";
import type { CloudInstance } from "~/types";
import { __throw, showError } from "~/util/helpers";
import { fetchAPI } from "../../api";
import { ProvisionDetailsStep } from "./steps/1_details";
import { ProvisionRegionsStep } from "./steps/2_regions";
import { ProvisionCategoryStep } from "./steps/3_category";
import { ProvisionInstanceTypesStep } from "./steps/4_type";
import { ProvisionComputeUnitsStep } from "./steps/5_units";
import { ProvisionFinalizeStep } from "./steps/6_finalize";
import type { ProvisionConfig, ProvisionStepProps } from "./types";
import { useQueryClient } from "@tanstack/react-query";

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
	ProvisionRegionsStep,
	ProvisionCategoryStep,
	ProvisionInstanceTypesStep,
	ProvisionComputeUnitsStep,
	ProvisionFinalizeStep,
] satisfies FC<ProvisionStepProps>[];

export function ProvisionPage() {
	const { setProvisioning } = useCloudStore.getState();
	const [, setActivePage] = useActiveCloudPage();

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
			setActivePage("instances");
		}
	});

	const previousStep = useStable((to?: number) => {
		if (step === 0) {
			setActivePage("instances");
		} else {
			setStep(to ?? step - 1);
		}
	});

	const nextStep = useStable((to?: number) => {
		if (step === 5) {
			provisionInstance();
			return;
		}

		setStep(to ?? step + 1);
	});

	useCloudPageFocus("provision", () => {
		setDetails(DEFAULT);
		setStep(0);
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
					maw={650}
					mx="auto"
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
