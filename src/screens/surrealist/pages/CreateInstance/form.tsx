import { Box, Button, Collapse, Divider, Group, Stack, Text } from "@mantine/core";
import { useEffect, useMemo } from "react";
import { useImmer } from "use-immer";
import { fetchAPI } from "~/cloud/api";
import { EstimatedCost } from "~/components/EstimatedCost";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useAvailableInstanceTypes, useOrganization } from "~/hooks/cloud";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import { CloudInstance } from "~/types";
import { showError } from "~/util/helpers";
import { iconArrowLeft } from "~/util/icons";
import { ProvisionDetailsStep } from "./steps/details";
import { ProvisionCategoryStep } from "./steps/type";
import { ProvisionConfig } from "./types";
import { Link } from "wouter";
import { ProvisionOrganizationStep } from "./steps/organization";

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
				<PrimaryTitle fz={26}>New Cloud instance</PrimaryTitle>
				<Text fz="xl">Create a managed cloud instance</Text>
			</Box>

			<Box mt="xl">
				<Text
					fz="xl"
					fw={600}
					c="bright"
				>
					Organization
				</Text>
				<Text>Choose which organization should own this instance</Text>
			</Box>

			<ProvisionOrganizationStep
				details={details}
				setDetails={setDetails}
			/>

			<Box mt="xl">
				<Text
					fz="xl"
					fw={600}
					c="bright"
				>
					Configuration
				</Text>
				<Text>Specify the instance name, region, and version</Text>
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
				<Link to="/overview">
					<Button
						w={150}
						color="slate"
						variant="light"
						leftSection={<Icon path={iconArrowLeft} />}
					>
						Back to overview
					</Button>
				</Link>
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
