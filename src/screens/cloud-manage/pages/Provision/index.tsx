import {
	Alert,
	Box,
	Button,
	Center,
	Divider,
	Grid,
	Group,
	Image,
	Paper,
	ScrollArea,
	Select,
	Stack,
	Table,
	Text,
	TextInput,
} from "@mantine/core";

import {
	useAvailableInstanceTypes,
	useAvailableInstanceVersions,
	useAvailableRegions,
	useIsAuthenticated,
	useOrganization,
} from "~/hooks/cloud";

import { useInputState } from "@mantine/hooks";
import { iconChevronLeft, iconChevronRight, iconPlus } from "~/util/icons";
import { useLayoutEffect, useMemo, useState } from "react";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { CounterInput } from "~/components/Inputs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { REGION_FLAGS } from "~/constants";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useCloudStore } from "~/stores/cloud";
import { useConfigStore } from "~/stores/config";
import type { CloudInstance } from "~/types";
import { showError } from "~/util/helpers";
import { fetchAPI } from "../../api";
import { InstanceType } from "../../components/InstanceType";
import { Tile } from "../../components/Tile";
import { useCloudInstances } from "../../hooks/instances";
import { useCloudTypeLimits } from "../../hooks/limits";

const PROVISION_STEPS = [
	"Instance details",
	"Select a region",
	"Select an instance type",
	"Select compute nodes",
	"Finalize your instance",
];

export function ProvisionPage() {
	const { setProvisioning } = useCloudStore.getState();
	const { setActiveCloudPage } = useConfigStore.getState();

	const [step, setStep] = useState(0);
	const isLight = useIsLight();

	const current = useOrganization();
	const isAuthed = useIsAuthenticated();
	const organizations = useCloudStore((s) => s.organizations);
	const instanceTypes = useAvailableInstanceTypes();
	const versions = useAvailableInstanceVersions();
	const regions = useAvailableRegions();

	const { data: instances } = useCloudInstances(current?.id);
	const isAvailable = useCloudTypeLimits(instances ?? []);

	const [name, setName] = useInputState("");
	const [version, setVersion] = useState<string>(versions.at(-1) ?? "");
	const [units, setUnits] = useState(1);
	const [org, setOrg] = useState<string>(current?.id || "");
	const [instance, setInstance] = useState<string>("");
	const [region, setRegion] = useState<string>("");

	// Selectable organization list
	const orgList = organizations.map((org) => ({
		value: org.id,
		label: org.name,
	}));

	// Active instance type information
	const instanceInfo = useMemo(() => {
		return instanceTypes.find((t) => t.slug === instance);
	}, [instance, instanceTypes]);

	const minComputeUnits = instanceInfo?.compute_units?.min ?? 1;
	const maxComputeUnits = instanceInfo?.compute_units?.max ?? 1;

	// Is the current instance is free
	const isFree = useMemo(() => {
		return instanceInfo?.price_hour === 0;
	}, [instanceInfo]);

	// Whether the user can continue to the next step
	const canContinue = useMemo(() => {
		if (step === 0) {
			return name.length > 0 && org.length > 0;
		}

		if (step === 1) {
			return region.length > 0;
		}

		if (step === 2) {
			return instance.length > 0;
		}

		return true;
	}, [step, name, org, instance, region]);

	// Provision the instance
	const provisionInstance = useStable(async () => {
		try {
			const result = await fetchAPI<CloudInstance>("/instances", {
				method: "POST",
				body: JSON.stringify({
					name,
					org,
					region,
					specs: {
						slug: instance,
						version: version,
						compute_units: isFree ? undefined : units,
					},
				}),
			});

			console.log("Provisioned instance:", result);

			setProvisioning(result);
		} catch (err: any) {
			console.log("Failed to provision database:", [...err.response.headers.entries()]);

			showError({
				title: "Failed to provision database",
				subtitle: "Please try again later",
			});
		} finally {
			setActiveCloudPage("instances");
		}
	});

	const updateInstance = (value: string) => {
		setInstance(value);
		setUnits(minComputeUnits);
	};

	const previousStep = useStable(() => {
		setStep(step - 1);
	});

	const nextStep = useStable(() => {
		if (step === 4) {
			provisionInstance();
		} else {
			setStep(step + 1);
		}
	});

	const willCreate = step === 4;
	const hourlyPriceCents = isFree ? 0 : instanceInfo?.price_hour ?? 0;
	const estimatedCost = (hourlyPriceCents / 100) * units;
	const hasSingleCompute = minComputeUnits === 1 && maxComputeUnits === 1;

	useLayoutEffect(() => {
		if (!isAuthed) {
			setActiveCloudPage("instances");
		}
	}, [isAuthed, setActiveCloudPage]);

	return (
		<>
			<Group
				pb="xl"
				mx="auto"
				gap="lg"
				justify="center"
			>
				{PROVISION_STEPS.map((info, index) => {
					const isDone = index < step;
					const isActive = index === step;

					return (
						<>
							<Group
								key={info}
								wrap="nowrap"
								c={isActive || isDone ? "bright" : isLight ? "slate.3" : "slate.5"}
							>
								<Center
									style={{
										borderRadius: "50%",
										width: 24,
										height: 24,
										background: isActive
											? "var(--surrealist-gradient)"
											: "var(--mantine-color-slate-7)",
									}}
								>
									{index + 1}
								</Center>
								<Text
									fz="lg"
									fw={500}
								>
									{info}
								</Text>
							</Group>
							{index < PROVISION_STEPS.length - 1 && (
								<Divider orientation="vertical" />
							)}
						</>
					);
				})}
			</Group>

			<ScrollArea
				scrollbars="y"
				flex={1}
			>
				<Form
					onSubmit={nextStep}
					w="100%"
					maw={652}
					mx="auto"
				>
					{step === 0 && (
						<Stack>
							<PrimaryTitle>Instance details</PrimaryTitle>

							<Text mb="lg">
								Please enter a name for your new instance, and select the
								organization you would like to create it under.
							</Text>

							<Grid
								mb="xl"
								styles={{
									col: { alignContent: "center" },
								}}
							>
								<Grid.Col span={4}>
									<Text>Instance name</Text>
								</Grid.Col>
								<Grid.Col span={8}>
									<TextInput
										placeholder="Instance name"
										value={name}
										onChange={setName}
										autoFocus
									/>
								</Grid.Col>
								<Grid.Col span={4}>
									<Text>Organization</Text>
								</Grid.Col>
								<Grid.Col span={8}>
									<Select
										placeholder="Organization"
										data={orgList}
										value={org}
										onChange={setOrg as any}
									/>
								</Grid.Col>
								<Grid.Col span={4}>
									<Text>SurrealDB Version</Text>
								</Grid.Col>
								<Grid.Col span={8}>
									<Select
										data={versions}
										value={version}
										onChange={setVersion as any}
									/>
								</Grid.Col>
							</Grid>
						</Stack>
					)}

					{step === 1 && (
						<Stack>
							<PrimaryTitle>Select a region</PrimaryTitle>

							<Text mb="lg">
								Regions define the physical location of your instance. Choosing a
								region close to your users can improve performance.
							</Text>

							<ScrollArea.Autosize mah="calc(100vh - 350px)">
								<Stack>
									{regions.map((type) => (
										<Tile
											key={type.slug}
											isActive={type.slug === region}
											onClick={() => setRegion(type.slug)}
										>
											<Group
												gap="xl"
												pl="xs"
											>
												<Image
													src={REGION_FLAGS[type.slug]}
													w={24}
												/>
												<Box>
													<Text
														c="bright"
														fw={500}
														fz="lg"
													>
														{type.description}
													</Text>
												</Box>
											</Group>
										</Tile>
									))}
								</Stack>
							</ScrollArea.Autosize>
						</Stack>
					)}

					{step === 2 && (
						<Stack>
							<PrimaryTitle>Select an instance type</PrimaryTitle>

							<Text mb="lg">
								Instance types define the resources allocated to your cloud
								instance. Choose a configuration that best fits your needs.
							</Text>

							<ScrollArea.Autosize mah="calc(100vh - 350px)">
								<Stack>
									{instanceTypes.map((type) => (
										<InstanceType
											key={type.slug}
											type={type}
											isActive={type.slug === instance}
											isLimited={!isAvailable(type)}
											onSelect={updateInstance}
										/>
									))}
								</Stack>
							</ScrollArea.Autosize>
						</Stack>
					)}

					{step === 3 && (
						<Stack>
							<PrimaryTitle>Customise compute nodes</PrimaryTitle>

							<Text mb="lg">
								Select the number of compute nodes you would like to use for your
								instance. Each compute node provides additional processing power to
								your instance.
							</Text>

							{hasSingleCompute ? (
								<Alert
									color="blue"
									title="Upgrade to use compute nodes"
								>
									Compute nodes are not customisable for free instances
								</Alert>
							) : (
								<>
									{instanceInfo && (
										<>
											<Text
												fw={600}
												fz="xl"
												c="bright"
											>
												Your selected instance
											</Text>
											<InstanceType
												type={instanceInfo}
												inactive
											/>
										</>
									)}
									<Text
										mt="xl"
										fw={600}
										fz="xl"
										c="bright"
									>
										Desired compute nodes
									</Text>

									<CounterInput
										value={units}
										onChange={setUnits}
										min={minComputeUnits}
										max={maxComputeUnits}
									/>
								</>
							)}
						</Stack>
					)}

					{step === 4 && (
						<Stack>
							<PrimaryTitle>Finalize your instance</PrimaryTitle>

							<Paper p="xl">
								<Table>
									<Table.Tbody>
										<Table.Tr>
											<Table.Td>Name</Table.Td>
											<Table.Td c="bright">{name}</Table.Td>
										</Table.Tr>
										<Table.Tr>
											<Table.Td>Instance Type</Table.Td>
											<Table.Td c="bright">{instance}</Table.Td>
										</Table.Tr>
										<Table.Tr>
											<Table.Td>Compute nodes</Table.Td>
											<Table.Td c="bright">{units}</Table.Td>
										</Table.Tr>
										<Table.Tr>
											<Table.Td>Region</Table.Td>
											<Table.Td c="bright">{region}</Table.Td>
										</Table.Tr>
										<Table.Tr>
											<Table.Td>Version</Table.Td>
											<Table.Td c="bright">{version}</Table.Td>
										</Table.Tr>
									</Table.Tbody>
								</Table>
								<Text
									fz="xl"
									fw={500}
									mt="xl"
									c={isLight ? "slate.7" : "slate.2"}
								>
									Estimated costs
								</Text>

								<Text
									fz={13}
									c={isLight ? "slate.6" : "slate.2"}
								>
									<Text
										span
										ml={4}
										fz={22}
										fw={500}
										c="bright"
									>
										${estimatedCost.toFixed(2)}
									</Text>
									/hour
								</Text>

								<Text
									fz={13}
									c={isLight ? "slate.6" : "slate.2"}
								>
									Approx.
									<Text
										span
										ml={4}
										fw={500}
										c="bright"
									>
										${(estimatedCost * 24 * 30).toFixed(2)}
									</Text>
									/month
								</Text>
							</Paper>
						</Stack>
					)}

					<Group mt={38}>
						{step === 0 ? (
							<Button
								w={150}
								color="slate"
								variant="light"
								onClick={() => setActiveCloudPage("instances")}
								leftSection={<Icon path={iconChevronLeft} />}
							>
								Go back
							</Button>
						) : (
							<Button
								w={150}
								color="slate"
								variant="light"
								onClick={previousStep}
								leftSection={<Icon path={iconChevronLeft} />}
							>
								Previous
							</Button>
						)}
						<Spacer />
						<Button
							w={150}
							type="submit"
							variant="gradient"
							disabled={!canContinue}
							rightSection={<Icon path={willCreate ? iconPlus : iconChevronRight} />}
						>
							{willCreate ? "Create" : "Continue"}
						</Button>
					</Group>
				</Form>
			</ScrollArea>
		</>
	);
}
