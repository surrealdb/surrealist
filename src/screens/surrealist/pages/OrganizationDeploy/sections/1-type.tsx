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
import { Updater } from "use-immer";
import { useStable } from "~/hooks/stable";
import { iconArrowLeft } from "~/util/icons";
import { Icon } from "~/components/Icon";
import { closeModal, openModal } from "@mantine/modals";
import { InstanceTypes } from "~/components/InstanceTypes";
import { isDistributedType } from "~/cloud/helpers";

const RECOMMENDED_TYPES = ["free", "small-dev", "medium", "medium-compute", "xlarge"];

export function InstanceTypeSection({ organisation, details, setDetails }: DeploySectionProps) {
	const instanceTypes = useInstanceTypeRegistry(organisation);
	const isAvailable = useInstanceTypeAvailable(organisation);

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
						onChange={(type) => {
							closeModal("instance-type");
							setDetails((draft) => {
								draft.type = type;
							});
						}}
					/>
				</>
			),
		});
	});

	const handleReset = useStable(() => {
		setDetails((draft) => {
			draft.type = null;
		});
	});

	const isRecommended = recommendations.some((type) => type.slug === details.type?.slug);

	return (
		<Box mt="xl">
			<PrimaryTitle fz={22}>System configuration</PrimaryTitle>
			<Text fz="lg">
				Select a recommended configuration to deploy your instance on, or choose a custom
				configuration.
			</Text>
			<SimpleGrid
				cols={3}
				mt="xl"
			>
				{details.type && !isRecommended ? (
					<>
						<Recommendation
							type={details.type}
							details={details}
							setDetails={setDetails}
						/>
					</>
				) : (
					recommendations.map((type) => (
						<Recommendation
							key={type.slug}
							type={type}
							details={details}
							setDetails={setDetails}
						/>
					))
				)}
			</SimpleGrid>
			<Group mt="xl">
				<Button
					mt="md"
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
					View all configurations
				</Button>
				{details.type && !isRecommended && (
					<Button
						mt="md"
						size="xs"
						color="slate"
						variant="light"
						onClick={handleReset}
					>
						Recommended configurations
					</Button>
				)}
			</Group>
		</Box>
	);
}

interface RecommendationProps {
	type: CloudInstanceType;
	details: DeployConfig;
	setDetails: Updater<DeployConfig>;
}

function Recommendation({ type, details, setDetails }: RecommendationProps) {
	const estimatedCost = type.price_hour / 1000;
	const isDistributed = isDistributedType(type);

	const handleSelect = useStable(() => {
		setDetails((draft) => {
			draft.type = type;
		});
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
			<Text c="slate.3">Cluster</Text>
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
				<Text fz="lg">
					{estimatedCost > 0 ? `${CURRENCY_FORMAT.format(estimatedCost)}/hour` : "Free"}
				</Text>
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
