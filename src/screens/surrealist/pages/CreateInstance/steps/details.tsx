import { Badge, Group, Image, Paper, Select, Stack, TextInput } from "@mantine/core";
import { type ChangeEvent, useLayoutEffect } from "react";
import { Icon } from "~/components/Icon";
import { REGION_FLAGS } from "~/constants";
import { useAvailableInstanceVersions, useOrganizations } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import { iconCheck } from "~/util/icons";
import type { ProvisionStepProps } from "../types";

export function ProvisionDetailsStep({ details, setDetails }: ProvisionStepProps) {
	const versions = useAvailableInstanceVersions();
	const organizations = useOrganizations();
	const regions = useCloudStore((s) => s.regions);

	const organization = organizations.find((org) => org.id === details.organization);

	const regionSet = new Set(organization?.plan.regions ?? []);
	const supportedRegions = regions.filter((region) => regionSet.has(region.slug));

	const versionList = versions.map((ver) => ({
		value: ver,
		label: `SurrealDB ${ver}`,
	}));

	const regionList = regions.map((region) => ({
		value: region.slug,
		label: region.description,
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

	const updateRegion = useStable((value: string | null) => {
		setDetails((draft) => {
			draft.region = value ?? "";
		});
	});

	useLayoutEffect(() => {
		if (!details.version) {
			setDetails((draft) => {
				draft.version = versions[0];
			});
		}
	}, [details.version, versions, setDetails]);

	useLayoutEffect(() => {
		if (!details.region) {
			setDetails((draft) => {
				draft.region = supportedRegions[0]?.slug ?? "";
			});
		}
	}, [details.region, supportedRegions, setDetails]);

	return (
		<>
			<Paper>
				<Stack
					p="lg"
					gap="xl"
				>
					<TextInput
						label="Instance name"
						placeholder="Instance name"
						value={details.name}
						onChange={updateName}
						error={
							details.name.length > 30
								? "Instance name cannot exceed than 30 characters"
								: null
						}
						autoFocus
					/>
					<Select
						label="Region"
						placeholder="Loading regions..."
						data={regionList}
						value={details.region}
						onChange={updateRegion}
						leftSection={
							<Image
								src={REGION_FLAGS[details.region]}
								w={18}
							/>
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
						label="SurrealDB Version"
						placeholder="Loading versions..."
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
			</Paper>
		</>
	);
}
