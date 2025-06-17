import {
	Badge,
	Box,
	Checkbox,
	Collapse,
	Divider,
	Group,
	Image,
	Select,
	Stack,
	TextInput,
} from "@mantine/core";

import { PrimaryTitle } from "~/components/PrimaryTitle";
import { DeploySectionProps } from "../types";
import { ChangeEvent, useLayoutEffect } from "react";
import { Icon } from "~/components/Icon";
import { REGION_FLAGS } from "~/constants";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import { iconCheck } from "~/util/icons";
import { useAvailableInstanceVersions } from "~/hooks/cloud";

export function DeploymentSection({ organisation, details, setDetails }: DeploySectionProps) {
	const regions = useCloudStore((s) => s.regions);

	const regionSet = new Set(organisation?.plan.regions ?? []);
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

	const versions = useAvailableInstanceVersions();

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

	const toggleDataset = useStable(() => {
		setDetails((draft) => {
			draft.dataset = !draft.dataset;
		});
	});

	const toggleCredentials = useStable(() => {
		setDetails((draft) => {
			draft.credentials = !draft.credentials;
		});
	});

	useLayoutEffect(() => {
		if (!details.version) {
			setDetails((draft) => {
				draft.version = versions[0];
			});
		}
	}, [details.version, versions, setDetails]);

	return (
		<Box mt={36}>
			<PrimaryTitle fz={22}>Instance details</PrimaryTitle>

			<Group
				gap={52}
				align="start"
			>
				<Stack
					gap="xl"
					mt="md"
					w="100%"
					maw={350}
				>
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

					<TextInput
						label="Name"
						placeholder="Instance name"
						description="Choose carefully, as this name cannot be changed later"
						value={details.name}
						onChange={updateName}
						error={
							details.name.length > 30
								? "Instance name cannot exceed 30 characters"
								: null
						}
					/>
				</Stack>
				<Stack
					gap="xl"
					mt="md"
					w="100%"
					maw={350}
				>
					<Checkbox
						label="Initialize with a sample dataset"
						checked={details.dataset}
						onChange={toggleDataset}
					/>
					<Box>
						<Checkbox
							label="Configure root credentials"
							checked={details.credentials}
							onChange={toggleCredentials}
						/>
						<Collapse in={details.credentials}>
							<Group>
								<Divider
									orientation="vertical"
									variant="dashed"
									mx="sm"
								/>
								<Stack
									flex={1}
									gap="xl"
									my="lg"
								>
									<TextInput
										label="Username"
										placeholder="root"
										value={details.username}
										onChange={(e) =>
											setDetails((draft) => {
												draft.username = e.currentTarget.value;
											})
										}
									/>
									<TextInput
										label="Password"
										placeholder="password"
										type="password"
										value={details.password}
										onChange={(e) =>
											setDetails((draft) => {
												draft.password = e.currentTarget.value;
											})
										}
									/>
								</Stack>
							</Group>
						</Collapse>
					</Box>
				</Stack>
			</Group>
		</Box>
	);
}
