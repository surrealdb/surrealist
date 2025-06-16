import {
	Alert,
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

								if (type.price_hour === 0) {
									draft.dataset = true;
								}
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
			<SimpleGrid
				cols={{ base: 1, xs: 2, md: 3 }}
				mt="xl"
			>
				{details.type && !isRecommended ? (
					<>
						<InstanceTypeCard
							type={details.type}
							details={details}
							setDetails={setDetails}
						/>
					</>
				) : (
					recommendations.map((type) => (
						<InstanceTypeCard
							key={type.slug}
							type={type}
							details={details}
							setDetails={setDetails}
						/>
					))
				)}
			</SimpleGrid>
			{details.type && !isRecommended ? (
				<Group mt={28}>
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
				</Group>
			) : (
				<Alert
					title="Looking for something else?"
					color="violet"
					variant="subtle"
					mt={28}
					p={0}
				>
					<Text inherit>
						Surreal Cloud offers a wide range of configurations to suit your needs.
					</Text>
					<Group mt="lg">
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
					</Group>
				</Alert>
			)}
		</Box>
	);
}

interface IntanceTypeCardProps {
	type: CloudInstanceType;
	details: DeployConfig;
	setDetails: Updater<DeployConfig>;
}

function InstanceTypeCard({ type, details, setDetails }: IntanceTypeCardProps) {
	const estimatedCost = type.price_hour / 1000;
	const isDistributed = isDistributedType(type);

	const handleSelect = useStable(() => {
		setDetails((draft) => {
			draft.type = type;

			if (type.price_hour === 0) {
				draft.dataset = true;
			}
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
