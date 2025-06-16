import { Badge, Box, Divider, Group, Paper, Stack, Text, Tooltip } from "@mantine/core";
import { Fragment, useMemo } from "react";
import { useInstanceTypeRegistry } from "~/cloud/hooks/types";
import { CloudInstanceType, CloudOrganization } from "~/types";
import { PrimaryTitle } from "../PrimaryTitle";
import { getTypeCategoryDescription, getTypeCategoryName } from "~/util/cloud";
import { CURRENCY_FORMAT, formatMemory } from "~/util/helpers";
import { iconAuth } from "~/util/icons";
import { Icon } from "../Icon";
import { Label } from "../Label";

const CATEGORIES = ["free", "development", "production", "production-compute", "production-memory"];

export interface InstanceTypesProps {
	value: CloudInstanceType | null;
	active?: string;
	organization: CloudOrganization;
	onChange: (value: CloudInstanceType) => void;
}

export function InstanceTypes({ value, active, organization, onChange }: InstanceTypesProps) {
	const instanceTypes = useInstanceTypeRegistry(organization);

	const categories = useMemo(() => {
		const typeList = [...instanceTypes.values()];

		return CATEGORIES.flatMap((category) => {
			const types = typeList
				.filter((type) => type.category === category)
				.sort((a, b) => {
					return a.price_hour - b.price_hour;
				});

			if (types.length === 0) {
				return [];
			}

			return [{ category, types }];
		});
	}, [instanceTypes]);

	return (
		<Stack gap={28}>
			{categories.map(({ category, types }) => (
				<Box key={category}>
					<Box>
						<PrimaryTitle>{getTypeCategoryName(category)}</PrimaryTitle>
						<Text>{getTypeCategoryDescription(category)}</Text>
					</Box>
					<Stack mt="xl">
						{types.map((type) => (
							<InstanceTypeRow
								selected={value?.slug === type.slug}
								active={active === type.slug}
								key={type.slug}
								limited={false}
								restricted={false}
								instanceType={type}
								onSelect={onChange}
							/>
						))}
					</Stack>
				</Box>
			))}
		</Stack>
	);
}

// export function InstanceTypes({
// 	value,
// 	active,
// 	organization,
// 	storageMode: _unused,
// 	onChange,
// }: InstanceTypesProps) {
// 	const instances = useCloudOrganizationInstancesQuery(organization?.id);
// 	const isAvailable = useCloudTypeLimits(instances.data ?? [], organization);
// 	const instanceTypes = organization?.plan.instance_types ?? [];

// 	const groupedTypes = useMemo(() => {
// 		return group(instanceTypes, (type) => type.category);
// 	}, [instanceTypes]);

// 	const handleUpdate = useStable((type: CloudInstanceType) => {
// 		onChange(type.slug);
// 	});

// 	return (
// 		<>
// 			<Accordion
// 				value={category}
// 				variant="separated"
// 				onChange={setCategory as any}
// 				chevronPosition="left"
// 				chevron={<Icon path={iconChevronDown} />}
// 				styles={{
// 					item: {
// 						backgroundColor: "var(--mantine-color-body)",
// 						overflow: "hidden",
// 					},
// 					control: {
// 						borderRadius: 0,
// 					},
// 				}}
// 			>
// 				{storageMode === "distributed" ? (
// 					<>
// 						<InstanceTypeCategory
// 							organization={organization}
// 							activeCategory={category}
// 							selectedType={value}
// 							activeType={active}
// 							category="production-memory"
// 							instanceTypes={groupedTypes["production-memory"] ?? []}
// 							withBillingRequired
// 							isAvailable={isAvailable}
// 							onSelect={handleUpdate}
// 						/>

// 						<InstanceTypeCategory
// 							organization={organization}
// 							activeCategory={category}
// 							selectedType={value}
// 							activeType={active}
// 							category="production-compute"
// 							instanceTypes={groupedTypes["production-compute"] ?? []}
// 							withBillingRequired
// 							isAvailable={isAvailable}
// 							onSelect={handleUpdate}
// 						/>
// 					</>
// 				) : (
// 					<>
// 						<InstanceTypeCategory
// 							organization={organization}
// 							activeCategory={category}
// 							selectedType={value}
// 							activeType={active}
// 							category="production"
// 							instanceTypes={groupedTypes.production ?? []}
// 							withBillingRequired
// 							isAvailable={isAvailable}
// 							onSelect={handleUpdate}
// 						/>
// 						<InstanceTypeCategory
// 							organization={organization}
// 							activeCategory={category}
// 							selectedType={value}
// 							activeType={active}
// 							category="development"
// 							instanceTypes={groupedTypes.development ?? []}
// 							withBillingRequired
// 							isAvailable={isAvailable}
// 							onSelect={handleUpdate}
// 						/>
// 						<InstanceTypeCategory
// 							organization={organization}
// 							activeCategory={category}
// 							selectedType={value}
// 							activeType={active}
// 							category="free"
// 							instanceTypes={groupedTypes.free ?? []}
// 							isAvailable={isAvailable}
// 							onSelect={handleUpdate}
// 						/>
// 					</>
// 				)}
// 			</Accordion>
// 		</>
// 	);
// }

// interface InstanceTypeCategoryProps {
// 	organization: CloudOrganization;
// 	activeCategory: string;
// 	selectedType: string;
// 	activeType?: string;
// 	category: string;
// 	instanceTypes: CloudInstanceType[];
// 	withBillingRequired?: boolean;
// 	isAvailable: (type: CloudInstanceType) => boolean;
// 	onSelect: (type: CloudInstanceType) => void;
// }

// function InstanceTypeCategory({
// 	organization,
// 	activeCategory,
// 	selectedType,
// 	activeType,
// 	category,
// 	instanceTypes,
// 	withBillingRequired,
// 	isAvailable,
// 	onSelect,
// }: InstanceTypeCategoryProps) {
// 	const hasBilling = (organization?.billing_info && organization?.payment_info) ?? false;

// 	return (
// 		<Accordion.Item value={category}>
// 			<Accordion.Control>
// 				<Group c={category === activeCategory ? "bright" : undefined}>
// 					<Text
// 						fw={600}
// 						fz="xl"
// 					>
// 						{getTypeCategoryName(category)}
// 					</Text>
// 				</Group>
// 			</Accordion.Control>
// 			<Accordion.Panel>
// 				<Stack
// 					gap="sm"
// 					mt="md"
// 				>
// 					{withBillingRequired && !hasBilling && (
// 						<Alert
// 							color="blue"
// 							title={`Upgrade to use ${category} instances`}
// 						>
// 							<Box>
// 								{capitalize(category)} instances require a billing plan to be
// 								enabled.
// 							</Box>
// 							<Button
// 								rightSection={<Icon path={iconChevronRight} />}
// 								color="blue"
// 								size="xs"
// 								mt="md"
// 								onClick={() => navigate(`/o/${organization.id}/billing`)}
// 							>
// 								Enter billing & payment details
// 							</Button>
// 						</Alert>
// 					)}

// 					{instanceTypes.map((type) => (
// 						<InstanceTypeRow
// 							key={type.slug}
// 							selected={selectedType}
// 							active={activeType === type.slug}
// 							limited={!isAvailable(type)}
// 							restricted={!!withBillingRequired && !hasBilling}
// 							instanceType={type}
// 							onSelect={onSelect}
// 						/>
// 					))}
// 				</Stack>
// 			</Accordion.Panel>
// 		</Accordion.Item>
// 	);
// }

interface InstanceTypeRowProps {
	selected: boolean;
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
		<Paper
			p="lg"
			variant={selected ? "selected" : "interactive"}
			// disabled={active || restricted || limited}
			// isActive={selected === instanceType.slug}
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
						<Text mt={2}>{CURRENCY_FORMAT.format(estimatedCost)} per hour</Text>
					) : (
						<Text
							fz="sm"
							mt={2}
						>
							No usage costs
						</Text>
					)}
				</Box>
				<Box
					w={96}
					ta="center"
				>
					<Text
						fz="lg"
						fw={500}
						c="bright"
					>
						{instanceType.cpu} Core
					</Text>
					<Label
						mt={2}
						c="slate.3"
					>
						vCPU
					</Label>
				</Box>
				<Divider orientation="vertical" />
				<Box
					w={96}
					ta="center"
				>
					<Text
						fz="lg"
						fw={500}
						c="bright"
					>
						{formatMemory(instanceType.memory)}
					</Text>
					<Label
						mt={2}
						c="slate.3"
					>
						Memory
					</Label>
				</Box>
			</Group>
		</Paper>
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
