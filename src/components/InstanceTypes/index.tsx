import {
	Accordion,
	Alert,
	Badge,
	Box,
	Button,
	Divider,
	Group,
	Skeleton,
	Stack,
	Text,
	Tooltip,
} from "@mantine/core";

import { capitalize, group } from "radash";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { navigate } from "wouter/use-browser-location";
import { useCloudTypeLimits } from "~/cloud/hooks/limits";
import { useCloudOrganizationInstancesQuery } from "~/cloud/queries/instances";
import { Icon } from "~/components/Icon";
import { Tile } from "~/components/Tile";
import { useStable } from "~/hooks/stable";
import { StorageMode } from "~/screens/surrealist/pages/CreateInstance/types";
import { CloudInstanceType, CloudOrganization } from "~/types";
import { getTypeCategoryName } from "~/util/cloud";
import { CURRENCY_FORMAT, formatMemory } from "~/util/helpers";
import { iconAuth, iconChevronDown, iconChevronRight } from "~/util/icons";
import { Label } from "../Label";

export interface InstanceTypesProps {
	value: string;
	active?: string;
	organization: CloudOrganization;
	storageMode?: StorageMode;
	onChange: (value: string) => void;
}

export function InstanceTypes({
	value,
	active,
	organization,
	storageMode,
	onChange,
}: InstanceTypesProps) {
	const instances = useCloudOrganizationInstancesQuery(organization?.id);
	const isAvailable = useCloudTypeLimits(instances.data ?? [], organization);
	const instanceTypes = organization?.plan.instance_types ?? [];

	const groupedTypes = useMemo(() => {
		return group(instanceTypes, (type) => type.category);
	}, [instanceTypes]);

	const handleUpdate = useStable((type: CloudInstanceType) => {
		onChange(type.slug);
	});

	const defaultCategory = useMemo(() => {
		if (active) {
			const category = instanceTypes.find((type) => type.slug === active)?.category;

			if (category) {
				return category;
			}
		}

		if (storageMode === "distributed") {
			return "production";
		}

		const freeType = instanceTypes.find((type) => type.category === "free");
		const isFreeAvailable = freeType && isAvailable(freeType);

		return isFreeAvailable ? "free" : "development";
	}, [active, instanceTypes, isAvailable, storageMode]);

	const [category, setCategory] = useState("");

	useLayoutEffect(() => {
		if (instances.isSuccess) {
			setCategory(defaultCategory);
		}
	}, [instances.isSuccess, defaultCategory]);

	const freeTypes = groupedTypes.free ?? [];
	const developmentTypes = groupedTypes.development ?? [];
	const productionTypes = groupedTypes.production ?? [];
	const prodCompTypes = groupedTypes["production-compute"] ?? [];

	const isDistributed = storageMode === "distributed";

	return (
		<>
			<Accordion
				value={category}
				variant="separated"
				onChange={setCategory as any}
				chevronPosition="left"
				chevron={<Icon path={iconChevronDown} />}
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
				{isDistributed ? (
					<>
						<InstanceTypeCategory
							organization={organization}
							activeCategory={category}
							selectedType={value}
							activeType={active}
							category="production"
							instanceTypes={productionTypes}
							withBillingRequired
							isAvailable={isAvailable}
							onSelect={handleUpdate}
							distributed
						/>

						<InstanceTypeCategory
							organization={organization}
							activeCategory={category}
							selectedType={value}
							activeType={active}
							category="production-compute"
							instanceTypes={prodCompTypes}
							withBillingRequired
							isAvailable={isAvailable}
							onSelect={handleUpdate}
							distributed
						/>
					</>
				) : (
					<>
						<InstanceTypeCategory
							organization={organization}
							activeCategory={category}
							selectedType={value}
							activeType={active}
							category="free"
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
							instanceTypes={productionTypes}
							withBillingRequired
							isAvailable={isAvailable}
							onSelect={handleUpdate}
						/>
					</>
				)}
			</Accordion>
		</>
	);
}

interface InstanceTypeCategoryProps {
	organization: CloudOrganization;
	activeCategory: string;
	selectedType: string;
	activeType?: string;
	category: string;
	distributed?: boolean;
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
	distributed,
	instanceTypes,
	withBillingRequired,
	isAvailable,
	onSelect,
}: InstanceTypeCategoryProps) {
	const hasBilling = (organization?.billing_info && organization?.payment_info) ?? false;

	return (
		<Accordion.Item value={category}>
			<Accordion.Control>
				<Group c={category === activeCategory ? "bright" : undefined}>
					<Text
						fw={600}
						fz="xl"
					>
						{getTypeCategoryName(category, distributed ?? false)}
					</Text>
				</Group>
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
								onClick={() => navigate(`/o/${organization.id}/billing`)}
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
