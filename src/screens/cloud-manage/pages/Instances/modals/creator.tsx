import classes from "../style.module.scss";
import { ActionIcon, Box, Button, Center, Grid, Group, Image, Loader, Modal, Progress, ScrollArea, Select, SimpleGrid, Stack, Table, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { REGION_FLAGS } from "~/constants";
import { useAvailableInstanceTypes, useAvailableInstanceVersions, useAvailableRegions, useOrganization } from "~/hooks/cloud";
import { useCloudStore } from "~/stores/cloud";
import { iconChevronLeft, iconChevronRight, iconClose, iconFloppy, iconMemory, iconPlus, iconQuery, iconSurreal } from "~/util/icons";
import { Tile } from "../../../components/Tile";
import { useStable } from "~/hooks/stable";
import { fetchAPI } from "../../../api";
import { showError, showInfo } from "~/util/helpers";
import { CloudInstance } from "~/types";
import { isEmpty, range } from "radash";
import { Form } from "~/components/Form";
import { useIsLight } from "~/hooks/theme";

interface CreationStepperProps {
	onClose: () => void;
	onComplete: (info?: CloudInstance) => void;
}

function CreationStepper({
	onClose,
	onComplete,
}: CreationStepperProps) {
	const [step, setStep] = useState(0);
	const taskRef = useRef<any>(null);
	const isLight = useIsLight();

	const current = useOrganization();
	const organizations = useCloudStore(s => s.organizations);
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
	const orgList = organizations.map(org => ({
		value: org.id,
		label: org.name
	}));

	// Active instance type information
	const instanceInfo = useMemo(() => {
		return instanceTypes.find(t => t.slug === instance);
	}, [instance, instanceTypes]);

	// Is the current instance type limited (no compute units)
	const isLimited = useMemo(() => {
		return isEmpty(instanceInfo?.compute_units);
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
						compute_units: isLimited ? undefined : units
					}
				})
			});

			console.log("Provisioned instance:", result);

			const task = setInterval(async () => {
				try {
					const instance = await fetchAPI<CloudInstance>(`/instances/${result.id}`);

					if (instance.state === "ready") {
						clearInterval(task);
						onComplete(result);
					}
				} catch {
					// Ignore and continue
				}
			}, 1500);

			taskRef.current = task;
		} catch (err: any) {
			console.log('Failed to provision database:', [...err.response.headers.entries()]);

			showError({
				title: "Failed to provision database",
				subtitle: "Please try again later"
			});

			onComplete();
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
				label: `${i} unit${i === 1 ? "" : "s"}`
			})
		);

		return [...options];
	}, [instanceInfo?.compute_units]);

	const updateInstance = (value: string) => {
		const info = instanceTypes.find(t => t.slug === value);
		const minUnits = info?.compute_units?.min ?? 1;

		setInstance(value);
		setUnits(minUnits);
	};

	const previousStep = useStable(() => {
		setStep(step - 1);
	});

	const nextStep = useStable(() => {
		if (step === 3) {
			provisionInstance();
		}

		setStep(step + 1);
	});

	useEffect(() => {
		return () => {
			if (taskRef.current) {
				clearInterval(taskRef.current);
			}
		};
	}, []);

	const willCreate = step === 3;
	const estimatedCost = (isLimited ? 0 : (3.5 * units)).toFixed(2);

	return (
		<>
			{step < 4 && (
				<Progress
					value={(step + 1) / 4 * 100}
					transitionDuration={200}
					radius="xl"
					mb="xl"
					styles={{
						section: {
							background: "var(--surrealist-gradient)"
						}
					}}
				/>
			)}

			<Form onSubmit={nextStep}>
				{step === 0 && (
					<Stack>
						<PrimaryTitle>
							Instance details
						</PrimaryTitle>

						<Text mb="lg">
							Please enter a name for your new instance, and select the organization you would like to create it under.
						</Text>

						<Grid
							mb="xl"
							styles={{
								col: { alignContent: "center" }
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
						<PrimaryTitle>
							Select a region
						</PrimaryTitle>

						<Text mb="lg">
							Regions define the physical location of your instance. Choosing a region close to your users can improve performance.
						</Text>

						<ScrollArea mah={300}>
							<Stack>
								{regions.map(type => (
									<Tile
										key={type.slug}
										isActive={type.slug === region}
										onClick={() => setRegion(type.slug)}
									>
										<Group gap="xl" pl="xs">
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
						<PrimaryTitle>
							Select an instance preset
						</PrimaryTitle>

						<Text mb="lg">
							Instance presets define the resources allocated to your cloud instance. Choose a preset that best fits your needs.
						</Text>

						<ScrollArea mah={300}>
							<Stack>
								{instanceTypes.map(type => (
									<Tile
										key={type.slug}
										isActive={type.slug === instance}
										onClick={() => updateInstance(type.slug)}
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
												<Text>
													{type.description}
												</Text>
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
															<Table.Td c="bright" miw={75} ta="right">
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
															<Table.Td c="bright" miw={75} ta="right">
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
															<Table.Td c="bright" miw={75} ta="right">
																{type.storage} GB
															</Table.Td>
														</Table.Tr>
													</Table.Tbody>
												</Table>
											</Box>
										</Group>
									</Tile>
								))}
							</Stack>
						</ScrollArea>
					</Stack>
				)}

				{step === 3 && (
					<Stack>
						<PrimaryTitle>
							Finalize your instance
						</PrimaryTitle>

						<PrimaryTitle fz="xl" mt="xl">
							Compute units
						</PrimaryTitle>

						<Text>
							Select the number of compute units you would like to use for your instance. Each compute unit
							provides additional processing power to your instance.
						</Text>

						<Select
							data={computeUnits}
							disabled={isLimited}
							value={units.toString()}
							onChange={(v) => v && setUnits(Number.parseInt(v))}
						/>

						<PrimaryTitle fz="xl" mt="xl">
							Overview
						</PrimaryTitle>

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

						<PrimaryTitle fz="xl" mt="xl">
							Estimated costs
						</PrimaryTitle>

						<Text
							fz={18}
							fw={500}
							c="bright"
						>
							${(instanceInfo?.price_hour ?? 0) * units} <Text span c={isLight ? "slate.6" : "slate.3"}>/hour</Text>
						</Text>
					</Stack>
				)}

				{step === 4 && (
					<Stack
						my={68}
						gap={2}
						align="center"
					>
						<ActionIcon
							variant="subtle"
							pos="absolute"
							top={20}
							right={20}
							onClick={onClose}
						>
							<Icon path={iconClose} />
						</ActionIcon>
						<Center
							className={classes.provisionBox}
							pos="relative"
							w={128}
							h={128}
						>
							<Loader
								className={classes.provisionLoader}
								color="slate.5"
								inset={0}
								size="100%"
								pos="absolute"
							/>
							<svg
								viewBox="0 0 24 24"
								className={classes.provisionIcon}
							>
								<path
									d={iconSurreal}
									fill={isLight ? "black" : "white"}
								/>
							</svg>
						</Center>
						<Text
							c="bright"
							fw={500}
							fz="xl"
							mt={36}
						>
							We are provisioning your instance
						</Text>
						<Text
							c="slate.3"
							fz="lg"
						>
							Hang tight, this should only take a few moments...
						</Text>
					</Stack>
				)}

				{step < 4 && (
					<SimpleGrid cols={2} mt="xl">
						{step === 0 ? (
							<Button
								onClick={onClose}
								color="slate"
								variant="light"
							>
								Close
							</Button>
						) : (
							<Button
								color="slate"
								variant="light"
								onClick={previousStep}
								leftSection={<Icon path={iconChevronLeft} />}
							>
								Previous
							</Button>
						)}
						<Button
							type="submit"
							variant="gradient"
							disabled={!canContinue}
							rightSection={<Icon path={willCreate ? iconPlus : iconChevronRight} />}
						>
							{willCreate ? "Create" : "Continue"}
						</Button>
					</SimpleGrid>
				)}
			</Form>
		</>
	);
}

export interface CreationModalProps {
	opened: boolean;
	onClose: () => void;
	onRefresh: () => void;
}

export function CreationModal({
	opened,
	onClose,
	onRefresh,
}: CreationModalProps) {
	const handleClose = useStable(() => {
		onClose();
	});

	const handleComplete = useStable((instance?: CloudInstance) => {
		onClose();
		onRefresh();

		if (instance) {
			showInfo({
				title: "Instance created",
				subtitle: (
					<>
						<Text span c="bright">{instance.name}</Text> has been created
					</>
				)
			});
		}
	});

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			closeOnClickOutside={false}
			trapFocus={false}
			size={525}
		>
			<CreationStepper
				onClose={handleClose}
				onComplete={handleComplete}
			/>
		</Modal>
	);
}