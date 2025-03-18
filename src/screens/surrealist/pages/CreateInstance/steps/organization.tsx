import { Select } from "@mantine/core";
import { useOrganizationSelection } from "~/cloud/hooks/organizations";
import { useOrganization } from "~/hooks/cloud";
import { useCloudStore } from "~/stores/cloud";
import type { ProvisionStepProps } from "../types";

export function ProvisionOrganizationStep({ details, setDetails }: ProvisionStepProps) {
	const { setSelectedOrganization } = useCloudStore.getState();

	const organization = useOrganization();
	const organizations = useOrganizationSelection();

	return (
		<>
			<Select
				data={organizations}
				value={organization?.id ?? ""}
				onChange={setSelectedOrganization as any}
				placeholder="Loading organizations..."
			/>
		</>
	);
}
