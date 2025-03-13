import { Divider, Group, Image, Paper, Select, Stack, TextInput } from "@mantine/core";
import { Text } from "@mantine/core";
import { type ChangeEvent, useLayoutEffect } from "react";
import { useOrganizationSelection } from "~/cloud/hooks/organizations";
import { Icon } from "~/components/Icon";
import { REGION_FLAGS } from "~/constants";
import { useAvailableInstanceVersions, useAvailableRegions, useOrganization } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import { iconCheck } from "~/util/icons";
import type { ProvisionStepProps } from "../types";

export function ProvisionDetailsStep({ details, setDetails }: ProvisionStepProps) {
	const { setSelectedOrganization } = useCloudStore.getState();

	const organization = useOrganization();
	const versions = useAvailableInstanceVersions();
	const organizations = useOrganizationSelection();
	const regions = useAvailableRegions();

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
				draft.version = versions.at(-1) ?? "";
			});
		}
	}, [details.version, versions, setDetails]);

	useLayoutEffect(() => {
		if (!details.region) {
			setDetails((draft) => {
				draft.region = regions.at(0)?.slug ?? "";
			});
		}
	}, [details.region, regions, setDetails]);

	return (
		<Paper>
			<Stack
				p="xl"
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
					label="Organization"
					data={organizations}
					value={organization?.id ?? ""}
					onChange={setSelectedOrganization as any}
				/>
			</Stack>
			<Divider my="xs" />
			<Stack
				p="xl"
				gap="xl"
			>
				<Select
					label="Version"
					description="Select the version of SurrealDB you would like to use"
					data={versionList}
					value={details.version}
					onChange={updateVersion}
				/>
				<Select
					label="Region"
					description="Choose a physical location for your instance"
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
			</Stack>
		</Paper>
	);
}
