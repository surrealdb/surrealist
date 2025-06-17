import {
	Box,
	Button,
	Checkbox,
	Divider,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Text,
} from "@mantine/core";
import { Fragment, ReactNode, useMemo } from "react";
import { useInstanceTypeAvailable, useInstanceTypeRegistry } from "~/cloud/hooks/types";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { CloudInstanceType } from "~/types";
import { getTypeCategoryName } from "~/util/cloud";
import { CURRENCY_FORMAT, formatMemory } from "~/util/helpers";
import { DeployConfig, DeploySectionProps } from "../types";
import { useStable } from "~/hooks/stable";
import { iconArrowLeft, iconArrowUpRight } from "~/util/icons";
import { Icon } from "~/components/Icon";
import { closeModal, openModal } from "@mantine/modals";
import { InstanceTypes } from "~/components/InstanceTypes";
import { isDistributedType } from "~/cloud/helpers";
import { useCloudOrganizationInstancesQuery } from "~/cloud/queries/instances";
import { Spacer } from "~/components/Spacer";

const RECOMMENDED_TYPES = ["free", "small-dev", "medium", "medium-compute", "xlarge"];

export function InstanceTypeSection({ organisation, details, setDetails }: DeploySectionProps) {
	const instanceTypes = useInstanceTypeRegistry(organisation);
	const isAvailable = useInstanceTypeAvailable(organisation);
	const instancesQuery = useCloudOrganizationInstancesQuery(organisation.id);

	const recommendations = useMemo(() => {
		const list = RECOMMENDED_TYPES.flatMap((slug) => {
			const type = instanceTypes.get(slug);

			if (type && isAvailable(type)) {
				return [type];
			}

			return [];
		});

		return list.slice(0, 3).reverse();
	}, [instanceTypes, isAvailable]);

	const handleUpdate = useStable((type: CloudInstanceType) => {
		closeModal("instance-type");
		setDetails((draft) => {
			draft.type = type;

			if (type.price_hour === 0) {
				draft.dataset = true;
			}

			if (instancesQuery.isSuccess) {
				const existing = new Set(instancesQuery.data.map((i) => i.name));
				const baseName = `${type.display_name}-instance`;

				let counter = 1;
				let name = baseName;

				while (existing.has(name)) {
					name = `${baseName}-${++counter}`;
				}

				draft.name = name;
			}
		});
	});

	const handleReset = useStable(() => {
		setDetails((draft) => {
			draft.type = null;
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
						hideLimited
					/>
				</>
			),
		});
	});

	const isRecommended = recommendations.some((type) => type.slug === details.type?.slug);

	return (
		<Box mt="xl">
			<SimpleGrid
				cols={{ base: 1, xs: 2, md: 3 }}
				mt="xl"
			>
				{details.type && !isRecommended ? (
					<>
						<InstanceTypeCard
							type={details.type}
							details={details}
							onChange={handleUpdate}
						/>
					</>
				) : (
					recommendations.map((type) => (
						<InstanceTypeCard
							key={type.slug}
							type={type}
							details={details}
							onChange={handleUpdate}
						/>
					))
				)}
			</SimpleGrid>
			<Group mt={28}>
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
				<Spacer />
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
						onClick={handleReset}
					>
						View pricing information
					</Button>
				</a>
			</Group>
		</Box>
	);
}

interface IntanceTypeCardProps {
	type: CloudInstanceType;
	details: DeployConfig;
	onChange: (type: CloudInstanceType) => void;
}

function InstanceTypeCard({ type, details, onChange }: IntanceTypeCardProps) {
	const estimatedCost = type.price_hour / 1000;
	const isDistributed = isDistributedType(type);

	const handleSelect = useStable(() => {
		onChange(type);
	});

	const features: ReactNode[] = [
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
				{isDistributed ? "Multi-Node" : "Single-Node"}
			</Text>
			<Text c="slate.3">{isDistributed ? "Cluster" : "Instance"}</Text>
		</Fragment>,
	];

	const isActive = details.type?.slug === type.slug;

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
