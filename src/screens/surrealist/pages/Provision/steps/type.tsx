import { Accordion, Alert, Badge, Box, Button, Group, Paper, Stack, Text } from "@mantine/core";

import { useAvailableInstanceTypes, useOrganization } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import type { ProvisionStepProps } from "../types";
import { CloudInstanceType } from "~/types";
import { useEffect, useMemo } from "react";
import { Tile } from "~/screens/surrealist/cloud-panel/components/Tile";
import { formatMemory, plural } from "~/util/helpers";
import { capitalize } from "radash";
import { iconChevronRight, iconWarning } from "~/util/icons";
import { Icon } from "~/components/Icon";
import { navigate } from "wouter/use-browser-location";
import { useCloudTypeLimits } from "~/cloud/hooks/limits";
import { useCloudOrganizationInstancesQuery } from "~/cloud/queries/instances";

function BillingAlert({ category }: { category: string }) {
	return (
		<Alert
			color="blue"
			title={`Upgrade to use ${category} instances`}
		>
			<Box>{capitalize(category)} instances require a billing plan to be enabled.</Box>
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
	);
}

interface InstanceTypeRowProps {
	active: string;
	disabled?: boolean;
	instanceType: CloudInstanceType;
	onSelect: (slug: CloudInstanceType) => void;
}

function InstanceTypeRow({ active, disabled, instanceType, onSelect }: InstanceTypeRowProps) {
	const hourlyPriceThousandth = instanceType?.price_hour ?? 0;
	const estimatedCost = hourlyPriceThousandth / 1000;

	return (
		<Tile
			p="lg"
			withBorder={false}
			disabled={disabled}
			isActive={active === instanceType.slug}
			onClick={() => onSelect(instanceType)}
		>
			<Group>
				<Box flex={1}>
					<Text
						c="bright"
						fw={500}
						fz="xl"
					>
						{instanceType.display_name}
					</Text>
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

export function ProvisionCategoryStep({ details, setDetails }: ProvisionStepProps) {
	const organization = useOrganization();
	const instanceTypes = useAvailableInstanceTypes();
	const instances = useCloudOrganizationInstancesQuery(organization?.id);
	const isAvailable = useCloudTypeLimits(instances.data ?? []);

	const freeType = useMemo(() => {
		return instanceTypes.find((type) => type.category === "free");
	}, [instanceTypes]);

	const developmentTypes = useMemo(() => {
		return instanceTypes.filter((type) => type.category === "development");
	}, [instanceTypes]);

	const productionTypes = useMemo(() => {
		return instanceTypes.filter((type) => type.category === "production");
	}, [instanceTypes]);

	const instanceType = useMemo(() => {
		return instanceTypes.find((t) => t.slug === details.type);
	}, [details.type, instanceTypes]);

	const updateCategory = useStable((category: string) => {
		setDetails((draft) => {
			draft.category = category;
		});
	});

	const updateType = useStable((type: CloudInstanceType) => {
		setDetails((draft) => {
			draft.type = type.slug;
			draft.units = type.compute_units.min ?? 1;
		});
	});

	const hasBilling = (organization?.billing_info && organization?.payment_info) ?? false;
	const isUnavailable = instanceType && !isAvailable(instanceType);
	const isFreeAvailable = freeType && isAvailable(freeType);

	useEffect(() => {
		if (!organization) return;

		setDetails((draft) => {
			draft.category = isFreeAvailable ? "free" : "development";
		});
	}, [setDetails, isFreeAvailable, organization]);

	return (
		<>
			<Accordion
				value={details.category}
				defaultValue={isFreeAvailable ? "free" : "development"}
				variant="separated"
				onChange={updateCategory as any}
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
				{isFreeAvailable && (
					<Accordion.Item value="free">
						<Accordion.Control>
							<Group>
								<Text
									c={details.category === "free" ? "bright" : undefined}
									fw={500}
									fz="lg"
								>
									Free instance
								</Text>
								<Badge
									color="slate"
									variant="light"
								>
									1
								</Badge>
							</Group>
						</Accordion.Control>
						<Accordion.Panel>
							<Stack
								gap="sm"
								mt="xl"
							>
								{freeType && (
									<InstanceTypeRow
										active={details.type}
										instanceType={freeType}
										onSelect={updateType}
									/>
								)}
							</Stack>
						</Accordion.Panel>
					</Accordion.Item>
				)}

				<Accordion.Item value="development">
					<Accordion.Control>
						<Group>
							<Text
								c={details.category === "development" ? "bright" : undefined}
								fw={500}
								fz="lg"
							>
								Development optimized
							</Text>
							<Badge
								color="slate"
								variant="light"
							>
								{developmentTypes.length}
							</Badge>
						</Group>
					</Accordion.Control>
					<Accordion.Panel>
						<Stack
							gap="sm"
							mt="xl"
						>
							{!hasBilling && <BillingAlert category="development" />}

							{developmentTypes.map((type) => (
								<InstanceTypeRow
									key={type.slug}
									active={details.type}
									disabled={!hasBilling}
									instanceType={type}
									onSelect={updateType}
								/>
							))}
						</Stack>
					</Accordion.Panel>
				</Accordion.Item>

				<Accordion.Item value="production">
					<Accordion.Control>
						<Group>
							<Text
								c={details.category === "production" ? "bright" : undefined}
								fw={500}
								fz="lg"
							>
								Production optimized
							</Text>
							<Badge
								color="slate"
								variant="light"
							>
								{productionTypes.length}
							</Badge>
						</Group>
					</Accordion.Control>
					<Accordion.Panel>
						<Stack
							gap="sm"
							mt="xl"
						>
							{!hasBilling && <BillingAlert category="production" />}

							{productionTypes.map((type) => (
								<InstanceTypeRow
									key={type.slug}
									active={details.type}
									disabled={!hasBilling}
									instanceType={type}
									onSelect={updateType}
								/>
							))}
						</Stack>
					</Accordion.Panel>
				</Accordion.Item>
			</Accordion>

			{isUnavailable && (
				<Alert
					mt="md"
					color="orange"
					icon={<Icon path={iconWarning} />}
					title="Limit reached"
				>
					Maximum instance limit reached for the selected instance type
				</Alert>
			)}
		</>
	);
}
