import { Badge, Group, Image, Select, Stack, TextInput } from "@mantine/core";
import { getCDNImageURL, Icon, iconCheck } from "@surrealdb/ui";
import { ChangeEvent, useLayoutEffect } from "react";
import { isScalePlan } from "~/cloud/helpers";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useAvailableInstanceVersions } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import { ON_FOCUS_SELECT } from "~/util/helpers";
import { filterSurrealDB3Versions } from "~/util/versions";
import { DeploySectionProps } from "../types";

export function DeploymentSection({ organisation, details, setDetails }: DeploySectionProps) {
	const versions = useAvailableInstanceVersions();
	const allRegions = useCloudStore((s) => s.instanceRegions);
	const regionSet = new Set(organisation?.plan.regions ?? []);
	const supportedRegions = allRegions
		.filter((region) => regionSet.has(region.slug))
		.sort((a, b) => a.description.localeCompare(b.description));

	const backupVersions = details.startingData.backupOptions?.backup?.valid_versions;
	const rawVersionSource = backupVersions ?? versions;
	const versionSource = isScalePlan(details.plan)
		? filterSurrealDB3Versions(rawVersionSource)
		: rawVersionSource;
	const latestVersion = versionSource[0];

	const regionList = supportedRegions.map((region) => ({
		value: region.slug,
		label: region.description,
	}));

	const regionFlags = Object.fromEntries(
		supportedRegions.map((region) => [region.slug, getCDNImageURL(region.flag)]),
	);

	const versionList = versionSource.map((ver) => ({
		value: ver,
		label: `SurrealDB ${ver}`,
	}));

	const updateRegion = useStable((value: string | null) => {
		setDetails((draft) => {
			draft.region = value ?? "";
			draft.startingData.backupOptions = undefined;
		});
	});

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
		const source = backupVersions ?? versions;
		const allowed = isScalePlan(details.plan) ? filterSurrealDB3Versions(source) : source;

		if (!allowed.length) {
			return;
		}

		if (!details.version || !allowed.includes(details.version)) {
			setDetails((draft) => {
				draft.version = allowed[0];
			});
		}
	}, [details.version, details.plan, backupVersions, versions, setDetails]);

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
							src={regionFlags[details.region]}
							w={18}
						/>
					)
				}
				renderOption={(org) => (
					<Group>
						<Image
							src={regionFlags[org.option.value]}
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
						{latestVersion === org.option.value && (
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
