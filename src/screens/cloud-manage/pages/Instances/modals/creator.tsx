import classes from "../style.module.scss";
import { Box, Button, Center, Divider, Grid, Group, Image, Loader, Modal, Paper, ScrollArea, Select, SimpleGrid, Stack, Stepper, Table, Text, TextInput, Tooltip } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useMemo, useState } from "react";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { REGION_FLAGS } from "~/constants";
import { useAvailableInstanceTypes, useAvailableRegions, useOrganization } from "~/hooks/cloud";
import { useCloudStore } from "~/stores/cloud";
import { iconCheck, iconChevronLeft, iconChevronRight, iconHelp, iconPlus, iconSurreal } from "~/util/icons";
import { Tile } from "../../../components/Tile";
import { useStable } from "~/hooks/stable";
import { ApiError, fetchAPI } from "../../../api";
import { showError, showInfo } from "~/util/helpers";
import { CloudInstance } from "~/types";

interface CreationStepperProps {
	onClose: () => void;
	onProvision: () => void;
	onComplete: (info?: CloudInstance) => void;
}

function CreationStepper({
	onClose,
	onProvision,
	onComplete,
}: CreationStepperProps) {
	const [step, setStep] = useState(0);

	const current = useOrganization();
	const organizations = useCloudStore(s => s.organizations);
	const instanceTypes = useAvailableInstanceTypes();
	const regions = useAvailableRegions();

	const [name, setName] = useInputState("");
	const [replicas, setReplicas] = useState("1");
	const [org, setOrg] = useState<string>(current?.id || "");
	const [instance, setInstance] = useState<string>("");
	const [region, setRegion] = useState<string>("");

	const orgList = organizations.map(org => ({
		value: org.id,
		label: org.name
	}));

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

	const provisionInstance = useStable(async () => {
		onProvision();

		try {
			const result = await fetchAPI<CloudInstance>("/instances", {
				method: "POST",
				body: JSON.stringify({
					name,
					org,
					region,
					specs: {
						slug: instance
					}
				})
			});

			const task = setInterval(async () => {
				try {
					await fetch(`https://${result.host}/health`);

					clearInterval(task);
					onComplete(result);
				} catch {
					// Ignore and continue
				}
			}, 3000);
		} catch (err: any) {
			let subtitle = err.message;

			console.log('Failed to provision database:', [...err.response.headers.entries()]);

			if (err instanceof ApiError && err.isJson()) {
				const { message } = await err.response.json();

				if (message) {
					subtitle = message;
				}
			}

			showError({
				title: "Failed to provision database",
				subtitle
			});

			onComplete();
		}
	});

	const previousStep = useStable(() => {
		setStep(step - 1);
	});

	const nextStep = useStable(() => {
		if (step === 3) {
			provisionInstance();
		}

		setStep(step + 1);
	});

	const willCreate = step === 3;

	return (
		<>
			<Stepper
				h={500}
				active={step}
				iconSize={28}
				size="xs"
				contentPadding="xl"
				className={classes.stepper}
				allowNextStepsSelect={false}
				completedIcon={<Icon path={iconCheck} />}
			>
				<Stepper.Step aria-label="Details">
					<Stack>
						<PrimaryTitle>
							Create an instance
						</PrimaryTitle>

						<Grid mt="xl">
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
						</Grid>
					</Stack>
				</Stepper.Step>
				<Stepper.Step aria-label="Region">
					<Stack>
						<PrimaryTitle>
							Select a region
						</PrimaryTitle>

						<Text mb="lg">
							Regions define the physical location of your instance. Choosing a region close to your users can improve performance.
						</Text>

						<ScrollArea h={300}>
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
				</Stepper.Step>
				<Stepper.Step aria-label="Instance preset">
					<Stack>
						<PrimaryTitle>
							Select an instance preset
						</PrimaryTitle>

						<Text mb="lg">
							Instance presets define the resources allocated to your cloud instance. Choose a preset that best fits your needs.
						</Text>

						<ScrollArea h={300}>
							<Stack>
								{instanceTypes.map(type => (
									<Tile
										key={type.slug}
										isActive={type.slug === instance}
										onClick={() => setInstance(type.slug)}
									>
										<Text
											c="bright"
											fw={600}
											fz="lg"
										>
											{type.slug}
										</Text>
										<Text
											c="slate.3"
											fz="sm"
										>
											{type.description}
										</Text>
										<Divider color="slate.7" my="sm" />
										<SimpleGrid cols={3}>
											<Box>
												<Label>
													vCPU
												</Label>
												<Text c="slate.0" fw={500}>
													{type.cpu}
												</Text>
											</Box>
											<Box>
												<Label>
													Memory
												</Label>
												<Text c="slate.0" fw={500}>
													{type.memory}MB
												</Text>
											</Box>
											<Box>
												<Label>
													Storage limit
												</Label>
												<Text c="slate.0" fw={500}>
													{type.storage}GB
												</Text>
											</Box>
										</SimpleGrid>
									</Tile>
								))}
							</Stack>
						</ScrollArea>
					</Stack>
				</Stepper.Step>
				<Stepper.Step aria-label="Confirm">
					<Stack>
						<PrimaryTitle>
							Finalize your instance
						</PrimaryTitle>

						<Text>
							Your new instance is nearly ready! Please choose how many compute units you would
							like to use, confirm your entered details, and press <Text span c="bright">Create</Text> once
							you are ready to provision your instance.
						</Text>

						<Select
							my="xl"
							label={
								<Group gap="xs">
									Compute units
									<Tooltip label="Explanation todo">
										<div>
											<Icon path={iconHelp} size="sm" />
										</div>
									</Tooltip>
								</Group>
							}
							data={[
								{ value: '1', label: "1 unit" },
								{ value: '2', label: "2 units" },
								{ value: '3', label: "3 units" },
								{ value: '4', label: "4 units" },
								{ value: '5', label: "5 units" }
							]}
							value={replicas}
							onChange={setReplicas as any}
						/>

						<Paper
							bg="slate.9"
							p="md"
						>
							<PrimaryTitle>
								Instance details
							</PrimaryTitle>
							<Table my="xl">
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
								</Table.Tbody>
							</Table>
							<Text>Estimated costs</Text>
							<Text
								fz={18}
								fw={500}
								c="bright"
							>
								${(3.5 * Number.parseInt(replicas)).toFixed(2)}<Text span c="slate.2">/mo</Text>
							</Text>
						</Paper>
					</Stack>
				</Stepper.Step>
				<Stepper.Completed>
					<Stack
						mt={84}
						gap={0}
						align="center"
					>
						<Center
							className={classes.provisionBox}
							pos="relative"
							w={128}
							h={128}
							bg="slate.9"
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
								<path d={iconSurreal} fill="white" />
							</svg>
						</Center>
						<Text
							c="bright"
							fw={500}
							fz="xl"
							mt={36}
						>
							Provisioning your database
						</Text>
						<Text
							c="slate"
							fz="lg"
						>
							Working...
						</Text>
					</Stack>
				</Stepper.Completed>
			</Stepper>

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
						onClick={nextStep}
						disabled={!canContinue}
						rightSection={<Icon path={willCreate ? iconPlus : iconChevronRight} />}
					>
						{willCreate ? "Create" : "Continue"}
					</Button>
				</SimpleGrid>
			)}
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
	const [provisioning, setProvisioning] = useState(false);

	const handleClose = useStable(() => {
		if (!provisioning) {
			onClose();
		}
	});

	const handleProvision = useStable(() => {
		setProvisioning(true);
	});

	const handleComplete = useStable((instance?: CloudInstance) => {
		setProvisioning(false);
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
			trapFocus={false}
			size={525}
		>
			<CreationStepper
				onClose={handleClose}
				onProvision={handleProvision}
				onComplete={handleComplete}
			/>
		</Modal>
	);
}