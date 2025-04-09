import { Group, Image, Select } from "@mantine/core";
import { useLayoutEffect } from "react";
import { Icon } from "~/components/Icon";
import { REGION_FLAGS } from "~/constants";
import { useOrganizations } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import { iconCheck } from "~/util/icons";
import type { ProvisionStepProps } from "../types";

export function ProvisionRegionStep({ details, setDetails }: ProvisionStepProps) {
	const organizations = useOrganizations();
	const regions = useCloudStore((s) => s.regions);

	const organization = organizations.find((org) => org.id === details.organization);

	const regionSet = new Set(organization?.plan.regions ?? []);
	const supportedRegions = regions.filter((region) => regionSet.has(region.slug));

	const regionList = regions.map((region) => ({
		value: region.slug,
		label: region.description,
	}));

	const updateRegion = useStable((value: string | null) => {
		setDetails((draft) => {
			draft.region = value ?? "";
		});
	});

	useLayoutEffect(() => {
		if (!details.region) {
			setDetails((draft) => {
				draft.region = supportedRegions[0]?.slug ?? "";
			});
		}
	}, [details.region, supportedRegions, setDetails]);

	return (
		<Select
			placeholder="Loading regions..."
			data={regionList}
			value={details.region}
			onChange={updateRegion}
			leftSection={
				details.region && (
					<Image
						src={REGION_FLAGS[details.region]}
						w={18}
					/>
				)
			}
			renderOption={(org) => (
				<Group>
					<Image
						src={REGION_FLAGS[org.option.value]}
						w={24}
					/>
					{org.option.label}
					{org.checked && (
						<Icon
							path={iconCheck}
							c="bright"
						/>
					)}
				</Group>
			)}
		/>
	);
}
