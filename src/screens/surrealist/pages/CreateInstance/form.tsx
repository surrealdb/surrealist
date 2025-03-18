import classes from "./style.module.scss";

import { Box, Button, Collapse, Divider, Group, ScrollArea, Stack, Text } from "@mantine/core";
import { useEffect, useMemo } from "react";
import { useImmer } from "use-immer";
import { fetchAPI } from "~/cloud/api";
import { EstimatedCost } from "~/components/EstimatedCost";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { TopGlow } from "~/components/TopGlow";
import { useAvailableInstanceTypes, useOrganization } from "~/hooks/cloud";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import { CloudInstance } from "~/types";
import { showError } from "~/util/helpers";
import { iconChevronLeft } from "~/util/icons";
import { ProvisionDetailsStep } from "./steps/details";
import { ProvisionCategoryStep } from "./steps/type";
import { ProvisionConfig } from "./types";

const DEFAULT: ProvisionConfig = {
	name: "",
	region: "",
	type: "",
	units: 1,
	version: "",
};

export interface ProvisionFormProps {
	onCreated: (instance: CloudInstance) => void;
}

export function ProvisionForm({ onCreated }: ProvisionFormProps) {
	const [, navigate] = useAbsoluteLocation();

	const authState = useCloudStore((s) => s.authState);
	const organization = useOrganization();
	const [details, setDetails] = useImmer(DEFAULT);
	const instanceTypes = useAvailableInstanceTypes();

	const instanceType = useMemo(() => {
		return instanceTypes.find((t) => t.slug === details.type);
	}, [details.type, instanceTypes]);

	const disabled = useMemo(() => {
		if (!details.name || details.name.length > 30) return true;
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

			onCreated(result);
		} catch (err: any) {
			console.log("Failed to provision database:", [...err.response.headers.entries()]);

			showError({
				title: "Failed to provision database",
				subtitle: "Please try again later",
			});
		}
	});

	useEffect(() => {
		if (authState === "unauthenticated") {
			navigate("/overview");
		}
	}, [authState]);

	return (
		<Stack
			mx="auto"
			maw={650}
			gap="xl"
		>
			<Box>
				<PrimaryTitle>New Cloud instance</PrimaryTitle>
				<Text fz="xl">Create a managed cloud instance</Text>
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
	);
}
