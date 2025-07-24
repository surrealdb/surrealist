import {
	Box,
	Button,
	Checkbox,
	Divider,
	Group,
	Paper,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
} from "@mantine/core";

import { closeModal, openModal } from "@mantine/modals";
import { Fragment, ReactNode, useMemo } from "react";
import { INSTANCE_PLAN_ARCHITECTURES, INSTANCE_PLAN_SUGGESTIONS } from "~/cloud/helpers";
import { useInstanceTypeRegistry } from "~/cloud/hooks/types";
import { useCloudOrganizationInstancesQuery } from "~/cloud/queries/instances";
import { Icon } from "~/components/Icon";
import { InstanceTypes } from "~/components/InstanceTypes";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useStable } from "~/hooks/stable";
import { CloudDeployConfig, CloudInstanceType } from "~/types";
import { getTypeCategoryName } from "~/util/cloud";
import { CURRENCY_FORMAT, formatMemory, optional } from "~/util/helpers";
import { iconArrowLeft, iconArrowUpRight } from "~/util/icons";
import { DeploySectionProps } from "../types";

export function InstanceTypeSection({ organisation, details, setDetails }: DeploySectionProps) {
	const instanceTypes = useInstanceTypeRegistry(organisation);

	const { isPending } = useCloudOrganizationInstancesQuery(organisation.id);

	const recommendations = useMemo(() => {
		return INSTANCE_PLAN_SUGGESTIONS[details.plan]
			.slice(0, 3)
			.reverse()
			.flatMap((slug) => optional(instanceTypes.get(slug)));
	}, [instanceTypes, details.plan]);

	const handleUpdate = useStable((type: CloudInstanceType) => {
		closeModal("instance-type");
		setDetails((draft) => {
			draft.type = type.slug;

			if (type.price_hour === 0) {
				draft.dataset = true;
			}
		});
	});

	const handleReset = useStable(() => {
		setDetails((draft) => {
			draft.type = "";
		});
	});

	const openInstanceTypeSelector = useStable(() => {
		openModal({
			modalId: "instance-type",
			title: <PrimaryTitle>Available configurations</PrimaryTitle>,
			withCloseButton: true,
			size: "lg",
			children: (
				<>
					<Text>
						Select a suitable configuration for your instance from the list below.
					</Text>
					<Divider my="xl" />
					<InstanceTypes
						organization={organisation}
						value={details.type}
						onChange={handleUpdate}
						plan={details.plan}
					/>
				</>
			),
		});
	});

	const isRecommended = recommendations.some((type) => type.slug === details.type);
	const selected = instanceTypes.get(details.type);

	return (
		<Box>
			<SimpleGrid cols={{ base: 1, xs: 2, md: 3 }}>
				{selected && !isRecommended ? (
					<InstanceTypeCard
						type={selected}
						details={details}
						onChange={handleUpdate}
					/>
				) : (
					recommendations.map((type) => (
						<Skeleton
							key={type.slug}
							visible={isPending}
						>
							<InstanceTypeCard
								type={type}
								details={details}
								onChange={handleUpdate}
							/>
						</Skeleton>
					))
				)}
			</SimpleGrid>
			<Group mt={28}>
				<a
					href="https://surrealdb.com/pricing"
					target="_blank"
					rel="noreferrer"
				>
					<Button
						size="xs"
						color="slate"
						variant="light"
						rightSection={<Icon path={iconArrowUpRight} />}
					>
						View pricing information
					</Button>
				</a>
				{details.type && !isRecommended ? (
					<>
						<Button
							size="xs"
							variant="gradient"
							onClick={openInstanceTypeSelector}
							rightSection={
								<Icon
									path={iconArrowLeft}
									flip="horizontal"
								/>
							}
						>
							Change configurations
						</Button>
						<Button
							size="xs"
							color="slate"
							variant="light"
							onClick={handleReset}
						>
							View featured configurations
						</Button>
					</>
				) : (
					<Button
						size="xs"
						variant="gradient"
						onClick={openInstanceTypeSelector}
						rightSection={
							<Icon
								path={iconArrowLeft}
								flip="horizontal"
							/>
						}
					>
						View all available configurations
					</Button>
				)}
			</Group>
		</Box>
	);
}

interface IntanceTypeCardProps {
	type: CloudInstanceType;
	details: CloudDeployConfig;
	onChange: (type: CloudInstanceType) => void;
}

function InstanceTypeCard({ type, details, onChange }: IntanceTypeCardProps) {
	const estimatedCost = type.price_hour / 1000;
	const [archName, archKind] = INSTANCE_PLAN_ARCHITECTURES[details.plan];

	const handleSelect = useStable(() => {
		onChange(type);
	});

	const features: ReactNode[] = [
		<Fragment key="cluster">
			<Text
				fw={500}
				c="bright"
			>
				{archName}
			</Text>
			<Text c="slate.3">{archKind}</Text>
		</Fragment>,
		<Fragment key="cpu">
			<Text
				fw={500}
				c="bright"
			>
				{type.cpu} Core
			</Text>
			<Text c="slate.3">vCPU</Text>
		</Fragment>,
		<Fragment key="memory">
			<Text
				fw={500}
				c="bright"
			>
				{formatMemory(type.memory)}
			</Text>
			<Text c="slate.3">Memory</Text>
		</Fragment>,
		<Fragment key="cluster">
			<Text
				fw={500}
				c="bright"
			>
				{type.default_storage_size} GB
			</Text>
			<Text c="slate.3">Storage</Text>
		</Fragment>,
	];

	const isActive = details.type === type.slug;

	return (
		<Paper
			p="xl"
			variant={isActive ? "selected" : "interactive"}
			onClick={handleSelect}
			aria-selected={isActive}
			tabIndex={0}
			role="radio"
		>
			<Group>
				<Box flex={1}>
					<Text
						c="surreal"
						fw={500}
					>
						{getTypeCategoryName(type.category)}
					</Text>
					<PrimaryTitle lh="h1">{type.display_name}</PrimaryTitle>
				</Box>
				<Group
					gap={4}
					align="start"
				>
					<Text
						fz="xl"
						fw={500}
						c="bright"
					>
						{estimatedCost > 0 ? `${CURRENCY_FORMAT.format(estimatedCost)}` : "Free"}
					</Text>
					<Text
						mt={6}
						fz="sm"
						fw={500}
					>
						/ hour
					</Text>
				</Group>
			</Group>
			<Divider my="xl" />
			<Stack gap="xs">
				{features.map((feature, i) => (
					<Group
						gap="xs"
						key={i}
					>
						<Checkbox
							checked
							role="presentation"
							tabIndex={-1}
							size="xs"
							mr="xs"
						/>
						{feature}
					</Group>
				))}
			</Stack>
		</Paper>
	);
}
