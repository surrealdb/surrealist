import { Badge, Group, Image, Select, Stack, TextInput } from "@mantine/core";
import { ChangeEvent, useLayoutEffect } from "react";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { REGION_FLAGS } from "~/constants";
import { useAvailableInstanceVersions } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import { ON_FOCUS_SELECT } from "~/util/helpers";
import { iconCheck } from "~/util/icons";
import { DeploySectionProps } from "../types";
export function DeploymentSection({ organisation, details, setDetails }: DeploySectionProps) {
	const versions = useAvailableInstanceVersions();
	const allRegions = useCloudStore((s) => s.regions);
	const regionSet = new Set(organisation?.plan.regions ?? []);
	const supportedRegions = allRegions.filter((region) => regionSet.has(region.slug));

	const regionList = supportedRegions.map((region) => ({
		value: region.slug,
		label: region.description,
	}));

	const updateRegion = useStable((value: string | null) => {
		setDetails((draft) => {
			draft.region = value ?? "";
		});
	});

	const versionList = versions.map((ver) => ({
		value: ver,
		label: `SurrealDB ${ver}`,
	}));

	const updateName = useStable((event: ChangeEvent<HTMLInputElement>) => {
		setDetails((draft) => {
			draft.name = event.target.value;
		});
	});

	const updateVersion = useStable((value: string | null) => {
		setDetails((draft) => {
			draft.version = value ?? "";
		});
	});

	useLayoutEffect(() => {
		if (!details.region) {
			setDetails((draft) => {
				draft.region = supportedRegions[0]?.slug ?? "";
			});
		}
	}, [details.region, supportedRegions, setDetails]);

	useLayoutEffect(() => {
		if (!details.version) {
			setDetails((draft) => {
				draft.version = versions[0];
			});
		}
	}, [details.version, versions, setDetails]);

	return (
		<Stack gap="lg">
			<PrimaryTitle>Instance details</PrimaryTitle>

			<TextInput
				label="Name"
				placeholder="Instance name"
				description="Choose carefully, as this name cannot be changed later"
				value={details.name}
				onChange={updateName}
				onFocus={ON_FOCUS_SELECT}
				error={
					details.name.length > 30 ? "Instance name cannot exceed 30 characters" : null
				}
			/>
			<Select
				label="Region"
				placeholder="Loading regions..."
				description="Select the region where your instance will be deployed"
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

			<Select
				label="Version"
				placeholder="Loading versions..."
				description="Select the SurrealDB version for your instance"
				data={versionList}
				value={details.version}
				onChange={updateVersion}
				renderOption={(org) => (
					<Group gap="sm">
						{org.option.label}
						{versionList[0].value === org.option.value && (
							<Badge
								variant="light"
								color="violet"
								size="xs"
							>
								Latest
							</Badge>
						)}
						{org.checked && (
							<Icon
								path={iconCheck}
								c="bright"
							/>
						)}
					</Group>
				)}
			/>
		</Stack>
	);
}
