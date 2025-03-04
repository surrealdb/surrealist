import {
	Accordion,
	Alert,
	Badge,
	Box,
	Button,
	Group,
	Paper,
	Stack,
	Text,
	Tooltip,
} from "@mantine/core";

import { capitalize, group } from "radash";
import { useMemo, useState } from "react";
import { navigate } from "wouter/use-browser-location";
import { useCloudTypeLimits } from "~/cloud/hooks/limits";
import { useCloudOrganizationInstancesQuery } from "~/cloud/queries/instances";
import { Icon } from "~/components/Icon";
import { Tile } from "~/components/Tile";
import { useAvailableInstanceTypes, useOrganization } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { CloudInstanceType, CloudOrganization } from "~/types";
import { formatMemory, plural } from "~/util/helpers";
import { iconAccount, iconAuth, iconChevronRight, iconClock } from "~/util/icons";

export interface InstanceTypesProps {
	value: string;
	active?: string;
	onChange: (value: string) => void;
}

export function InstanceTypes({ value, active, onChange }: InstanceTypesProps) {
	const organization = useOrganization();
	const instanceTypes = useAvailableInstanceTypes();
	const instances = useCloudOrganizationInstancesQuery(organization?.id);
	const isAvailable = useCloudTypeLimits(instances.data ?? []);

	const groupedTypes = useMemo(() => {
		return group(instanceTypes, (type) => type.category);
	}, [instanceTypes]);

	const handleUpdate = useStable((type: CloudInstanceType) => {
		onChange(type.slug);
	});

	const freeType = instanceTypes.find((type) => type.category === "free");
	const isFreeAvailable = freeType && isAvailable(freeType);

	const [category, setCategory] = useState(isFreeAvailable ? "free" : "development");

	const freeTypes = groupedTypes.free ?? [];
	const developmentTypes = groupedTypes.development ?? [];
	const productionTypes = groupedTypes.production ?? [];

	return (
		organization && (
			<>
				<Accordion
					value={category}
					variant="separated"
					onChange={setCategory as any}
					styles={{
						item: {
							backgroundColor: "var(--mantine-color-body)",
							overflow: "hidden",
						},
						control: {
							borderRadius: 0,
						},
					}}
				>
					<InstanceTypeCategory
						organization={organization}
						activeCategory={category}
						selectedType={value}
						activeType={active}
						category="free"
						title="Free"
						description="A free instance to get started with SurrealDB"
						instanceTypes={freeTypes}
						isAvailable={isAvailable}
						onSelect={handleUpdate}
					/>

					<InstanceTypeCategory
						organization={organization}
						activeCategory={category}
						selectedType={value}
						activeType={active}
						category="development"
						title="Development"
						description="Configurations optimized for development workloads"
						instanceTypes={developmentTypes}
						withBillingRequired
						isAvailable={isAvailable}
						onSelect={handleUpdate}
					/>

					<InstanceTypeCategory
						organization={organization}
						activeCategory={category}
						selectedType={value}
						activeType={active}
						category="production"
						title="Production"
						description="Configurations optimized for production workloads"
						instanceTypes={productionTypes}
						withBillingRequired
						isAvailable={isAvailable}
						onSelect={handleUpdate}
					/>
				</Accordion>
			</>
		)
	);
}

interface InstanceTypeCategoryProps {
	organization: CloudOrganization;
	activeCategory: string;
	selectedType: string;
	activeType?: string;
	category: string;
	title: string;
	description: string;
	instanceTypes: CloudInstanceType[];
	withBillingRequired?: boolean;
	isAvailable: (type: CloudInstanceType) => boolean;
	onSelect: (type: CloudInstanceType) => void;
}

function InstanceTypeCategory({
	organization,
	activeCategory,
	selectedType,
	activeType,
	category,
	title,
	description,
	instanceTypes,
	withBillingRequired,
	isAvailable,
	onSelect,
}: InstanceTypeCategoryProps) {
	const hasBilling = (organization?.billing_info && organization?.payment_info) ?? false;

	return (
		<Accordion.Item value={category}>
			<Accordion.Control>
				<Text
					c={category === activeCategory ? "bright" : undefined}
					fw={500}
					fz="lg"
				>
					{title}
				</Text>
				<Text opacity={0.6}>{description}</Text>
			</Accordion.Control>
			<Accordion.Panel>
				<Stack
					gap="sm"
					mt="md"
				>
					{withBillingRequired && !hasBilling && (
						<Alert
							color="blue"
							title={`Upgrade to use ${category} instances`}
						>
							<Box>
								{capitalize(category)} instances require a billing plan to be
								enabled.
							</Box>
							<Button
								rightSection={<Icon path={iconChevronRight} />}
								color="blue"
								size="xs"
								mt="md"
								onClick={() => navigate("/billing")}
							>
								Enter billing & payment details
							</Button>
						</Alert>
					)}

					{instanceTypes.map((type) => (
						<InstanceTypeRow
							key={type.slug}
							selected={selectedType}
							active={activeType === type.slug}
							limited={!isAvailable(type)}
							restricted={!!withBillingRequired && !hasBilling}
							instanceType={type}
							onSelect={onSelect}
						/>
					))}
				</Stack>
			</Accordion.Panel>
		</Accordion.Item>
	);
}

interface InstanceTypeRowProps {
	selected: string;
	active: boolean;
	limited: boolean;
	restricted: boolean;
	instanceType: CloudInstanceType;
	onSelect: (slug: CloudInstanceType) => void;
}

function InstanceTypeRow({
	selected,
	active,
	limited,
	restricted,
	instanceType,
	onSelect,
}: InstanceTypeRowProps) {
	const hourlyPriceThousandth = instanceType?.price_hour ?? 0;
	const estimatedCost = hourlyPriceThousandth / 1000;
	const kind = instanceType.category === "free" ? "free" : "paid";

	return (
		<Tile
			p="lg"
			withBorder={false}
			disabled={active || restricted || limited}
			isActive={selected === instanceType.slug}
			onClick={() => onSelect(instanceType)}
		>
			<Group>
				<Box flex={1}>
					<Group gap="sm">
						<Text
							c="bright"
							fw={500}
							fz="xl"
						>
							{instanceType.display_name}
						</Text>
						{active ? (
							<Badge
								size="sm"
								variant="light"
							>
								Active
							</Badge>
						) : restricted ? (
							<LockAlert label="You need to upgrade to use paid instances" />
						) : (
							limited && (
								<LockAlert
									label={`You have reached the limit of ${kind} instances`}
								/>
							)
						)}
					</Group>
					{estimatedCost > 0 ? (
						<Text
							fz="sm"
							mt={2}
						>
							${estimatedCost.toFixed(3)}/hour
						</Text>
					) : (
						<Text
							fz="sm"
							mt={2}
						>
							No usage costs
						</Text>
					)}
				</Box>
				<Paper
					bg="slate.6"
					w={96}
					ta="center"
					p="xs"
				>
					<Text
						c="bright"
						fw={800}
						fz="sm"
					>
						vCPU
					</Text>
					<Text
						fz="lg"
						fw={500}
					>
						{instanceType.cpu} {plural(instanceType.cpu, "Core")}
					</Text>
				</Paper>
				<Paper
					bg="slate.6"
					w={96}
					ta="center"
					py="xs"
				>
					<Text
						c="bright"
						fw={600}
						fz="sm"
					>
						Memory
					</Text>
					<Text
						fz="lg"
						fw={500}
					>
						{formatMemory(instanceType.memory)}
					</Text>
				</Paper>
			</Group>
		</Tile>
	);
}

function LockAlert({ label }: { label: string }) {
	return (
		<Tooltip label={label}>
			<div>
				<Icon
					path={iconAuth}
					mt={-2}
				/>
			</div>
		</Tooltip>
	);
}
