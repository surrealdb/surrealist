import {
	ActionIcon,
	Box,
	Divider,
	Group,
	Input,
	NumberInput,
	Paper,
	Select,
	SimpleGrid,
	Stack,
	Text,
} from "@mantine/core";
import { closeModal, openModal } from "@mantine/modals";
import { useInstanceTypeRegistry } from "~/cloud/hooks/types";
import { Icon } from "~/components/Icon";
import { InstanceTypes } from "~/components/InstanceTypes";
import { Label } from "~/components/Label";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useStable } from "~/hooks/stable";
import { CloudInstanceType } from "~/types";
import { plural } from "~/util/helpers";
import { iconChevronY, iconDatabase, iconMemory, iconPlus } from "~/util/icons";
import { DeploySectionProps } from "../types";

export function ClusterOptionsSection({ organisation, details, setDetails }: DeploySectionProps) {
	const computeTypes = useInstanceTypeRegistry(organisation, "compute");
	const storageTypes = useInstanceTypeRegistry(organisation, "storage");

	const computeType = computeTypes.get(details.computeType);
	const storageType = storageTypes.get(details.storageType);

	const updateComputeUnits = useStable((value: string | number) => {
		setDetails((draft) => {
			draft.computeUnits = Number(value);
		});
	});

	const updateStorageUnits = useStable((value: string | number) => {
		setDetails((draft) => {
			draft.storageUnits = Number(value);
		});
	});

	const updateStorageAmount = useStable((value: string | number) => {
		setDetails((draft) => {
			draft.storageAmount = Number(value);
		});
	});

	const handleUpdateComputeType = useStable((type: CloudInstanceType) => {
		closeModal("instance-type");
		setDetails((draft) => {
			draft.computeType = type.slug;

			if (type.price_hour === 0) {
				draft.startingData = {
					type: "dataset",
				};
			}
		});
	});

	const handleUpdateStorageType = useStable((type: CloudInstanceType) => {
		closeModal("instance-type");
		setDetails((draft) => {
			draft.storageType = type.slug;
		});
	});

	const openComputeTypeSelector = useStable(() => {
		openModal({
			modalId: "instance-type",
			title: <PrimaryTitle>Available compute configurations</PrimaryTitle>,
			withCloseButton: true,
			size: "lg",
			children: (
				<>
					<Text>
						Select a suitable compute configuration for your instance from the list
						below.
					</Text>
					<Divider my="xl" />
					<InstanceTypes
						variant="compute"
						organization={organisation}
						value={details.computeType}
						withPrices={false}
						onChange={handleUpdateComputeType}
						plan={details.plan}
					/>
				</>
			),
		});
	});

	const openStorageTypeSelector = useStable(() => {
		openModal({
			modalId: "instance-type",
			title: <PrimaryTitle>Available storage configurations</PrimaryTitle>,
			withCloseButton: true,
			size: "lg",
			children: (
				<>
					<Text>
						Select a suitable storage configuration for your instance from the list
						below.
					</Text>
					<Divider my="xl" />
					<InstanceTypes
						variant="storage"
						organization={organisation}
						value={details.storageType}
						withPrices={false}
						onChange={handleUpdateStorageType}
						plan={details.plan}
					/>
				</>
			),
		});
	});

	return (
		<Box>
			<SimpleGrid cols={{ base: 1, xl: 2 }}>
				<Paper
					p="xl"
					variant="gradient"
				>
					<Group>
						<Icon
							path={iconMemory}
							size="xl"
						/>
						<Text
							fz="xl"
							fw={600}
							c="bright"
						>
							Compute
						</Text>
					</Group>
					<Divider my="md" />
					<Stack>
						<Group>
							<Label flex={1}>Instance type</Label>
							<Input
								readOnly
								placeholder="Select type..."
								value={computeType?.display_name}
								onClick={openComputeTypeSelector}
								rightSection={
									<Icon
										path={iconChevronY}
										size="sm"
									/>
								}
							/>
						</Group>
						<Group>
							<Label flex={1}>Compute nodes</Label>
							<IntegerInput
								min={1}
								max={10}
								step={1}
								suffix={` ${plural(details.computeUnits, "Node")}`}
								value={details.computeUnits}
								onChange={updateComputeUnits}
							/>
						</Group>
					</Stack>
				</Paper>
				<Paper
					p="xl"
					variant="gradient"
				>
					<Group>
						<Icon
							path={iconDatabase}
							size="xl"
						/>
						<Text
							fz="xl"
							fw={600}
							c="bright"
						>
							Storage
						</Text>
					</Group>
					<Divider my="md" />
					<Stack>
						<Group>
							<Label flex={1}>Instance type</Label>
							<Input
								readOnly
								placeholder="Select type..."
								value={storageType?.display_name}
								onClick={openStorageTypeSelector}
								rightSection={
									<Icon
										path={iconChevronY}
										size="sm"
									/>
								}
							/>
						</Group>
						<Group>
							<Label flex={1}>Storage x Nodes</Label>
							<IntegerInput
								min={100}
								max={6000}
								step={100}
								suffix={` GB`}
								value={details.storageAmount}
								onChange={updateStorageAmount}
							/>
							<Icon
								path={iconPlus}
								style={{ transform: "rotate(45deg)" }}
							/>
							<Select
								data={[
									{ label: "3 Nodes", value: "3" },
									{ label: "6 Nodes", value: "6" },
									{ label: "9 Nodes", value: "9" },
								]}
								value={details.storageUnits.toString()}
								onChange={(value) => updateStorageUnits(Number(value))}
							/>
						</Group>
					</Stack>
				</Paper>
			</SimpleGrid>
		</Box>
	);
}

function round(n: number, step: number) {
	return n - (n % step);
}

export interface IntegerInputProps {
	min: number;
	max: number;
	value: number;
	step: number;
	suffix?: string;
	onChange: (value: number | string) => void;
}

export function IntegerInput({ value, min, max, step, suffix, onChange }: IntegerInputProps) {
	return (
		<NumberInput
			min={min}
			max={max}
			w={150}
			hideControls
			allowLeadingZeros={false}
			allowNegative={false}
			allowDecimal={false}
			suffix={suffix}
			value={value}
			onChange={onChange}
			rightSectionWidth={36}
			styles={{
				input: {
					textAlign: "center",
				},
			}}
			leftSection={
				<ActionIcon
					disabled={value <= min}
					variant="subtle"
					color="slate"
					onClick={() => onChange(Math.max(min, round(value - step, step)))}
				>
					<Text>-</Text>
				</ActionIcon>
			}
			rightSection={
				<ActionIcon
					disabled={value >= max}
					variant="subtle"
					color="slate"
					onClick={() => onChange(Math.min(max, round(value + step, step)))}
				>
					<Text>+</Text>
				</ActionIcon>
			}
		/>
	);
}
