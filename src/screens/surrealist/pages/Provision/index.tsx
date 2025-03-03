import classes from "./style.module.scss";
import cloudIconUrl from "~/assets/images/cloud-icon.webp";

import {
	Box,
	Button,
	Collapse,
	Divider,
	Group,
	Image,
	Paper,
	ScrollArea,
	Stack,
} from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useImmer } from "use-immer";
import { useAvailableInstanceTypes, useOrganization } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import type { CloudInstance } from "~/types";
import { __throw, showError } from "~/util/helpers";
import { ProvisionDetailsStep } from "./steps/details";
import { ProvisionCategoryStep } from "./steps/type";
import { ProvisionComputeUnitsStep } from "./steps/compute";
import type { ProvisionConfig } from "./types";
import { fetchAPI } from "~/cloud/api";
import { useAbsoluteLocation } from "~/hooks/routing";
import { TopGlow } from "~/components/TopGlow";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { EstimatedCost } from "../../cloud-panel/components/EstimatedCost";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { iconChevronLeft } from "~/util/icons";
import { Text } from "@mantine/core";

const DEFAULT: ProvisionConfig = {
	name: "",
	region: "",
	type: "",
	units: 1,
	version: "",
};

export function ProvisionPage() {
	const { setProvisioning } = useCloudStore.getState();
	const [, navigate] = useAbsoluteLocation();

	const authState = useCloudStore((s) => s.authState);
	const organization = useOrganization();
	const [details, setDetails] = useImmer(DEFAULT);
	const instanceTypes = useAvailableInstanceTypes();
	const client = useQueryClient();

	const instanceType = useMemo(() => {
		return instanceTypes.find((t) => t.slug === details.type);
	}, [details.type, instanceTypes]);

	const disabled = useMemo(() => {
		if (!details.name) return true;
		if (!details.region) return true;
		if (!details.type) return true;
		if (!details.version) return true;

		if (details.type !== "free" && !details.units) return true;

		return false;
	}, [details]);

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

	useEffect(() => {
		if (authState === "unauthenticated") {
			navigate("/overview");
		}
	}, [authState]);

	return (
		<Box
			flex={1}
			pos="relative"
		>
			<TopGlow offset={200} />

			<ScrollArea
				pos="absolute"
				scrollbars="y"
				type="scroll"
				inset={0}
				className={classes.scrollArea}
				viewportProps={{
					style: { paddingBlock: 75 },
				}}
			>
				<Stack
					mx="auto"
					maw={650}
					gap="xl"
				>
					<Box>
						<PrimaryTitle>New instance</PrimaryTitle>
						<Text fz="xl">Provision a new managed Surreal Cloud instance</Text>
					</Box>

					<ProvisionDetailsStep
						details={details}
						setDetails={setDetails}
					/>

					<Box mt="xl">
						<Text
							fz="xl"
							fw={600}
							c="bright"
						>
							Instance type
						</Text>
						<Text>Configure system configuration</Text>
					</Box>

					<ProvisionCategoryStep
						details={details}
						setDetails={setDetails}
					/>

					<Box mt="xl">
						<Text
							fz="xl"
							fw={600}
							c="bright"
						>
							Compute nodes
						</Text>
						<Text>Allocate additional compute nodes to your instance</Text>
					</Box>

					<ProvisionComputeUnitsStep
						details={details}
						setDetails={setDetails}
					/>

					{instanceType && (
						<Collapse in={!!instanceType}>
							<Divider my="md" />
							<EstimatedCost
								type={instanceType}
								units={details.units}
							/>
						</Collapse>
					)}

					<Group mt="xl">
						<Button
							w={150}
							color="slate"
							variant="light"
							onClick={() => navigate("/overview")}
							leftSection={<Icon path={iconChevronLeft} />}
						>
							Back
						</Button>
						<Spacer />
						<Button
							w={150}
							type="submit"
							variant="gradient"
							disabled={disabled}
							onClick={provisionInstance}
						>
							Create instance
						</Button>
					</Group>
				</Stack>
			</ScrollArea>
		</Box>
	);
}

export default ProvisionPage;
