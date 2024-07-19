import classes from "../style.module.scss";
import { Box, Button, Center, Divider, Group, Image, Loader, Modal, ScrollArea, Select, SimpleGrid, Stack, Stepper, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useMemo, useState } from "react";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { REGION_FLAGS } from "~/constants";
import { useAvailableInstanceTypes, useAvailableRegions, useOrganization } from "~/hooks/cloud";
import { useCloudStore } from "~/stores/cloud";
import { iconCheck, iconChevronLeft, iconChevronRight, iconPlus, iconSurreal } from "~/util/icons";
import { Tile } from "../../../components/Tile";
import { useStable } from "~/hooks/stable";
import { ApiError, fetchAPI } from "../../../api";
import { showError } from "~/util/helpers";
import { CloudInstance } from "~/types";

interface CreationStepperProps {
	onClose: () => void;
	onProvision: () => void;
	onComplete: () => void;
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
			return instance.length > 0;
		}

		if (step === 2) {
			return region.length > 0;
		}

		return true;
	}, [step, name, org, instance, region]);

	const provisionInstance = useStable(async () => {
		onProvision();

		try {
			const { host } = await fetchAPI<CloudInstance>("/instances", {
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
					await fetch(`https://${host}/health`);

					clearInterval(task);
					onComplete();
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
		if (step === 2) {
			provisionInstance();
		}

		setStep(step + 1);
	});

	const willCreate = step === 2;

	return (
		<>
			<Stepper
				h={450}
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

						<Text mb="lg">
							Lorem ipsum, dolor sit amet consectetur adipisicing elit. Dignissimos officia voluptate architecto aliquam expedita? Aspernatur, repudiandae neque? Quam consequatur delectus reprehenderit ex a sunt, explicabo maiores nulla dolorem vel distinctio.
						</Text>

						<TextInput
							label="Instance name"
							value={name}
							onChange={setName}
							autoFocus
						/>

						<Select
							label="Organization"
							data={orgList}
							value={org}
							onChange={setOrg as any}
						/>
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

			{step < 3 && (
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

	const handleComplete = useStable(() => {
		setProvisioning(false);
		onClose();
		onRefresh();
	});

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			trapFocus={false}
			size="md"
		>
			<CreationStepper
				onClose={handleClose}
				onProvision={handleProvision}
				onComplete={handleComplete}
			/>
		</Modal>
	);
}