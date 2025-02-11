import { Alert, Box, Button, Collapse, Divider, Group, SimpleGrid, Text } from "@mantine/core";
import { Stack } from "@mantine/core";
import { closeAllModals, openModal } from "@mantine/modals";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { capitalize } from "radash";
import { useState } from "react";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useAvailableInstanceTypes, useOrganization } from "~/hooks/cloud";
// import { useActiveCloudPage } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { fetchAPI } from "~/screens/surrealist/cloud-panel/api";
import { useCloudOrganizationInstancesQuery } from "~/screens/surrealist/cloud-panel/hooks/instances";
import { useCloudTypeLimits } from "~/screens/surrealist/cloud-panel/hooks/limits";
import type { CloudInstance } from "~/types";
import { iconChevronLeft, iconChevronRight, iconWarning } from "~/util/icons";
import { CategoryPicker } from "../../CategoryPicker";
import { EstimatedCost } from "../../EstimatedCost";
import { InstanceType } from "../../InstanceType";

export async function openInstanceTypeModal(instance: CloudInstance) {
	openModal({
		size: "lg",
		title: (
			<Box>
				<PrimaryTitle>Change instance type</PrimaryTitle>
				<Text fz="lg">Instance: {instance.name}</Text>
			</Box>
		),
		children: <InstanceTypeModal instance={instance} />,
	});
}

interface InstanceTypeModalProps {
	instance: CloudInstance;
}

function InstanceTypeModal({ instance }: InstanceTypeModalProps) {
	const instanceTypes = useAvailableInstanceTypes();
	const organization = useOrganization();
	const client = useQueryClient();
	// const [, setActivePage] = useActiveCloudPage();

	const [category, setCategory] = useState("");
	const [instanceType, setInstanceType] = useState("");

	const { data: instances } = useCloudOrganizationInstancesQuery(organization?.id);
	const isAvailable = useCloudTypeLimits(instances ?? []);

	const instanceInfo = instanceTypes.find((type) => type.slug === instanceType);
	const filteredTypes = instanceTypes.filter((type) => type.category === category);

	const { mutateAsync, isPending } = useMutation({
		mutationFn: async (slug: string) => {
			await fetchAPI(`/instances/${instance.id}/type`, {
				method: "PATCH",
				body: JSON.stringify({
					slug,
				}),
			});

			client.invalidateQueries({
				queryKey: ["cloud", "instances"],
			});
		},
	});

	const requestChange = useStable(() => {
		mutateAsync(instanceType).then(() => {
			closeAllModals();
		});
	});

	const hasBilling = (organization?.billing_info && organization?.payment_info) ?? false;
	const isUnavailable = instanceInfo && !isAvailable(instanceInfo);

	return (
		<Stack>
			<InstanceType
				type={instance.type}
				isSelected={false}
				withBorder={false}
				inactive
				onBody
				status={
					<Text
						c="surreal"
						fz="sm"
						fw={500}
						tt="uppercase"
					>
						Currently active
					</Text>
				}
			/>

			{category ? (
				<>
					<Box
						mt="xl"
						mb="sm"
					>
						<PrimaryTitle>Instance type</PrimaryTitle>
						<Text mt={2}>
							Instance types define the resources allocated to your cloud instance.
							Choose a configuration that best fits your needs.
						</Text>
					</Box>

					{!hasBilling && category !== "free" && (
						<Alert
							mb="lg"
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
								onClick={() => {
									// FIXME repair
									// setActivePage("billing");
									closeAllModals();
								}}
							>
								Enter billing & payment details
							</Button>
						</Alert>
					)}

					<SimpleGrid cols={{ base: 1, md: 2 }}>
						{filteredTypes.map((type) => (
							<InstanceType
								key={type.slug}
								type={type}
								isSelected={type.slug === instanceType}
								isActive={type.slug === instance.type.slug}
								onSelect={() => setInstanceType(type.slug)}
								onBody
							/>
						))}
					</SimpleGrid>

					{isUnavailable && (
						<Alert
							color="orange"
							icon={<Icon path={iconWarning} />}
						>
							Maximum instance limit reached for this type
						</Alert>
					)}

					<Collapse in={!!instanceInfo}>
						<Divider my="md" />
						<EstimatedCost
							type={instanceInfo}
							units={instance.compute_units}
						/>
					</Collapse>
				</>
			) : (
				<>
					<Box
						mt="xl"
						mb="sm"
					>
						<PrimaryTitle>Instance category</PrimaryTitle>
						<Text mt={2}>
							Select a category to view available configurations and change the
							instance type
						</Text>
					</Box>

					{organization && (
						<CategoryPicker
							organization={organization}
							value={category}
							onChange={setCategory}
							hideFree={instance.type.category === "free"}
							onBody
						/>
					)}
				</>
			)}

			<Group mt="lg">
				{category ? (
					<Button
						leftSection={<Icon path={iconChevronLeft} />}
						color="slate"
						variant="light"
						flex={1}
						onClick={() => {
							setCategory("");
							setInstanceType("");
						}}
					>
						Change category
					</Button>
				) : (
					<Button
						onClick={() => closeAllModals()}
						color="slate"
						variant="light"
						flex={1}
					>
						Close
					</Button>
				)}
				<Button
					type="submit"
					variant="gradient"
					onClick={requestChange}
					disabled={!instanceType || instance.type.slug === instanceType || isUnavailable}
					loading={isPending}
					flex={1}
				>
					Save changes
				</Button>
			</Group>
		</Stack>
	);
}
