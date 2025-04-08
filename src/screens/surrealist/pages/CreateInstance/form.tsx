import { Box, Button, Collapse, Divider, Group, Stack, Text } from "@mantine/core";
import { useMemo } from "react";
import { useImmer } from "use-immer";
import { Link } from "wouter";
import { fetchAPI } from "~/cloud/api";
import { EstimatedCost } from "~/components/EstimatedCost";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useOrganizations } from "~/hooks/cloud";
import { useLastSavepoint } from "~/hooks/overview";
import { useStable } from "~/hooks/stable";
import { CloudInstance } from "~/types";
import { tagEvent } from "~/util/analytics";
import { showError } from "~/util/helpers";
import { iconArrowLeft } from "~/util/icons";
import { ProvisionDetailsStep } from "./steps/details";
import { ProvisionOrganizationStep } from "./steps/organization";
import { ProvisionCategoryStep } from "./steps/type";
import { ProvisionConfig } from "./types";

const DEFAULT: ProvisionConfig = {
	organization: "",
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
	const organizations = useOrganizations();
	const [details, setDetails] = useImmer(DEFAULT);
	const organization = organizations.find((org) => org.id === details.organization);
	const instanceTypes = organization?.plan.instance_types ?? [];

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

			tagEvent("cloud_instance_created", {
				region: details.region,
				version: details.version,
				compute_type: details.type,
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

	const savepoint = useLastSavepoint();

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

			<Link to={savepoint.path}>
				<Button
					variant="light"
					color="slate"
					size="xs"
					leftSection={<Icon path={iconArrowLeft} />}
				>
					Back to {savepoint.name}
				</Button>
			</Link>

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
				<Link to={savepoint.path}>
					<Button
						color="slate"
						variant="light"
					>
						Cancel
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
