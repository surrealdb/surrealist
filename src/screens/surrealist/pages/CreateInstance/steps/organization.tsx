import { Select } from "@mantine/core";
import { useEffect, useLayoutEffect } from "react";
import { useSearchParams } from "wouter";
import { useOrganizationSelection } from "~/cloud/hooks/organizations";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import { iconOrganization } from "~/util/icons";
import type { ProvisionStepProps } from "../types";

export function ProvisionOrganizationStep({ details, setDetails }: ProvisionStepProps) {
	const organizations = useOrganizationSelection();
	const profile = useCloudStore((s) => s.profile);
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
			placeholder="Loading organizations..."
			leftSection={details.organization && <Icon path={iconOrganization} />}
			wrapperProps={{
				__vars: {
					"--input-section-color": "var(--mantine-color-surreal-text)",
				},
			}}
		/>
	);
}
