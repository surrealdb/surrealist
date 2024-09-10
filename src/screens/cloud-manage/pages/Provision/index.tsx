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
import { useInputState } from "@mantine/hooks";
import { range } from "radash";
import { useLayoutEffect, useMemo, useState } from "react";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { REGION_FLAGS } from "~/constants";
import {
	useAvailableInstanceTypes,
	useAvailableInstanceVersions,
	useAvailableRegions,
	useIsAuthenticated,
	useOrganization,
} from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useCloudStore } from "~/stores/cloud";
import { useConfigStore } from "~/stores/config";
import type { CloudInstance, CloudInstanceType } from "~/types";
import { showError } from "~/util/helpers";
import {
	iconChevronLeft,
	iconChevronRight,
	iconCircle,
	iconCircleFilled,
	iconFloppy,
	iconMemory,
	iconPlus,
	iconQuery,
} from "~/util/icons";
import { fetchAPI } from "../../api";
import { Tile } from "../../components/Tile";

const PROVISION_STEPS = [
	{
		title: "Instance details",
		name: "Details",
	},
	{
		title: "Select a region",
		name: "Region",
	},
	{
		title: "Select an instance preset",
		name: "Instance preset",
	},
	{
		title: "Select compute units",
		name: "Compute units",
	},
	{
		title: "Finalize your instance",
		name: "Finalize",
	},
];

interface InstanceTypeProps {
	type: CloudInstanceType;
	isActive: boolean;
	onSelect: (type: string) => void;
}

function InstanceType({ type, isActive, onSelect }: InstanceTypeProps) {
	return (
		<Tile
			isActive={isActive}
			onClick={() => onSelect(type.slug)}
		>
			<Group wrap="nowrap">
				<Box flex={1}>
					<Text
						c="bright"
						fw={600}
						fz="lg"
					>
						{type.slug}
					</Text>
					<Text>{type.description}</Text>
				</Box>
				<Box>
					<Table>
						<Table.Tbody>
							<Table.Tr>
								<Table.Td>
									<Group>
										<Icon path={iconQuery} />
										vCPU
									</Group>
								</Table.Td>
								<Table.Td
									c="bright"
									miw={75}
									ta="right"
								>
									{type.cpu}
								</Table.Td>
							</Table.Tr>
							<Table.Tr>
								<Table.Td>
									<Group>
										<Icon path={iconMemory} />
										Memory
									</Group>
								</Table.Td>
								<Table.Td
									c="bright"
									miw={75}
									ta="right"
								>
									{type.memory} MB
								</Table.Td>
							</Table.Tr>
							<Table.Tr>
								<Table.Td>
									<Group>
										<Icon path={iconFloppy} />
										Storage limit
									</Group>
								</Table.Td>
								<Table.Td
									c="bright"
									miw={75}
									ta="right"
								>
									{type.storage} GB
								</Table.Td>
							</Table.Tr>
						</Table.Tbody>
					</Table>
				</Box>
			</Group>
		</Tile>
	);
}

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

	// Compute unit options
	const computeUnits = useMemo(() => {
		if (!instanceInfo?.compute_units) {
			return [];
		}

		const options = range(
			instanceInfo.compute_units.min ?? 1,
			instanceInfo.compute_units.max ?? 5,
			(i) => ({
				value: i.toString(),
				label: `${i} unit${i === 1 ? "" : "s"}`,
			}),
		);

		return [...options];
	}, [instanceInfo?.compute_units]);

	const updateInstance = (value: string) => {
		const info = instanceTypes.find((t) => t.slug === value);
		const minUnits = info?.compute_units?.min ?? 1;

		setInstance(value);
		setUnits(minUnits);
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
	const estimatedCost = (isFree ? 0 : (instanceInfo?.price_hour ?? 0) * units).toFixed(2);

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
								key={info.title}
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
									{info.name}
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
									<Text>Version</Text>
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

							<ScrollArea mah={300}>
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
							</ScrollArea>
						</Stack>
					)}

					{step === 2 && (
						<Stack>
							<PrimaryTitle>Select an instance preset</PrimaryTitle>

							<Text mb="lg">
								Instance presets define the resources allocated to your cloud
								instance. Choose a preset that best fits your needs.
							</Text>

							<ScrollArea mah={300}>
								<Stack>
									{instanceTypes.map((type) => (
										<InstanceType
											key={type.slug}
											type={type}
											isActive={type.slug === instance}
											onSelect={updateInstance}
										/>
									))}
								</Stack>
							</ScrollArea>
						</Stack>
					)}

					{step === 3 && (
						<Stack>
							<PrimaryTitle>Choose compute units</PrimaryTitle>

							<Text mb="lg">
								Select the number of compute units you would like to use for your
								instance. Each compute unit provides additional processing power to
								your instance.
							</Text>

							{isFree && (
								<Alert
									color="blue"
									title="Upgrade to use compute units"
								>
									Compute unit upgrades are not available for free instances
								</Alert>
							)}

							<Select
								data={computeUnits}
								disabled={isFree}
								value={units.toString()}
								onChange={(v) => v && setUnits(Number.parseInt(v))}
							/>
						</Stack>
					)}

					{step === 4 && (
						<Stack>
							<PrimaryTitle>Finalize your instance</PrimaryTitle>

							<Paper p="md">
								<Table>
									<Table.Tbody>
										<Table.Tr>
											<Table.Td>Name</Table.Td>
											<Table.Td c="bright">{name}</Table.Td>
										</Table.Tr>
										<Table.Tr>
											<Table.Td>Preset</Table.Td>
											<Table.Td c="bright">{instance}</Table.Td>
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
									fz={18}
									fw={500}
									c="bright"
								>
									${estimatedCost}{" "}
									<Text
										span
										c={isLight ? "slate.6" : "slate.3"}
									>
										/hour
									</Text>
								</Text>
							</Paper>
						</Stack>
					)}

					<Group mt={38}>
						{step === 0 ? (
							<Button
								w={150}
								onClick={() => setActiveCloudPage("instances")}
								color="slate"
								variant="light"
							>
								Close
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
