import { Select } from "@mantine/core";
import { useLayoutEffect } from "react";
import { useSearchParams } from "wouter";
import { useOrganizationSelection } from "~/cloud/hooks/organizations";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { iconOrganization } from "~/util/icons";
import type { ProvisionStepProps } from "../types";
import { useCloudProfile } from "~/hooks/cloud";

export function ProvisionOrganizationStep({ details, setDetails }: ProvisionStepProps) {
	const organizations = useOrganizationSelection();
	const profile = useCloudProfile();
	const [search] = useSearchParams();

	const updateOrganization = useStable((org: string) => {
		setDetails((draft) => {
			draft.organization = org;
		});
	});

	useLayoutEffect(() => {
		if (!details.organization) {
			setDetails((draft) => {
				draft.organization = search.get("organization") ?? profile.default_org;
			});
		}
	}, [details.organization, search, profile, setDetails]);

	return (
		<Select
			data={organizations}
			value={details.organization}
			onChange={updateOrganization as any}
			placeholder="Loading organisations..."
			leftSection={details.organization && <Icon path={iconOrganization} />}
			wrapperProps={{
				__vars: {
					"--input-section-color": "var(--mantine-color-surreal-text)",
				},
			}}
		/>
	);
}
