import { Alert, Badge, Box, Button, Collapse, Group, Stack, Text } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useAvailableInstanceTypes, useOrganization } from "~/hooks/cloud";
import { useActiveCloudPage } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { Tile } from "~/screens/cloud-panel/components/Tile";
import { useCloudInstancesQuery } from "~/screens/cloud-panel/hooks/instances";
import { useCloudTypeLimits } from "~/screens/cloud-panel/hooks/limits";
import { useConfigStore } from "~/stores/config";
import { iconChevronRight, iconHammer, iconQuery, iconStar, iconWarning } from "~/util/icons";
import { StepActions } from "../actions";
import type { ProvisionStepProps } from "../types";

export function ProvisionCategoryStep({
	step,
	details,
	setDetails,
	onPrevious,
	onContinue,
}: ProvisionStepProps) {
	const [, setActivePage] = useActiveCloudPage();

	const organization = useOrganization();
	const hasBilling = (organization?.billing_info && organization?.payment_info) ?? false;
	const instanceTypes = useAvailableInstanceTypes();
	const freeInstance = instanceTypes.find((t) => t.slug === "free");
	const instancesQuery = useCloudInstancesQuery(organization?.id);
	const isAvailable = useCloudTypeLimits(instancesQuery.data ?? []);
	const freeInstanceAvailable = freeInstance && isAvailable(freeInstance);

	const updateCategory = (value: string) => {
		setDetails((draft) => {
			draft.category = value;

			if (value === "free") {
				draft.type = "free";
				draft.units = 1;
			} else {
				draft.type = "";
			}
		});
	};

	const handleContinue = useStable(() => {
		onContinue(details.category === "free" ? 5 : undefined);
	});

	return (
		<Stack>
			<PrimaryTitle>Select instance category</PrimaryTitle>

			<Text mb="lg">
				Optimise your experience by selecting the instance category that best aligns with
				your project's goals.
			</Text>

			<Tile
				isActive={details.category === "production"}
				onClick={() => updateCategory("production")}
			>
				<Group>
					<Icon path={iconQuery} />
					<PrimaryTitle
						c="bright"
						fw={600}
						fz="lg"
					>
						Production
					</PrimaryTitle>
				</Group>
				<Text mt="sm">
					For production environments, data at scale, or professional use cases.
				</Text>
			</Tile>
			<Tile
				isActive={details.category === "development"}
				onClick={() => updateCategory("development")}
			>
				<Group>
					<Icon path={iconHammer} />
					<PrimaryTitle
						c="bright"
						fw={600}
						fz="lg"
					>
						Development
					</PrimaryTitle>
				</Group>
				<Text mt="sm">For testing, starter projects, or for low-traffic applications.</Text>
			</Tile>
			<Tile
				isActive={details.category === "free"}
				onClick={() => updateCategory("free")}
				disabled={!freeInstanceAvailable}
			>
				<Group>
					<Icon path={iconStar} />
					<PrimaryTitle
						c="bright"
						fw={600}
						fz="lg"
					>
						Free instance
					</PrimaryTitle>
				</Group>
				<Text mt="sm">
					Experience Surreal Cloud with a single free instance to get started.
				</Text>
				{!freeInstanceAvailable && (
					<Group
						mt="sm"
						gap="xs"
					>
						<Icon
							path={iconWarning}
							c="orange"
							size="sm"
						/>
						<Text
							c="orange"
							fw={500}
						>
							Maximum amount of free instances in use
						</Text>
					</Group>
				)}
			</Tile>

			<Collapse in={!!details.category && details.category !== "free" && !hasBilling}>
				<Alert
					mt="xl"
					color="blue"
					title="Upgrade to use premium instances"
				>
					<Box>Premium instances require a billing plan to be enabled.</Box>
					<Button
						rightSection={<Icon path={iconChevronRight} />}
						color="blue"
						size="xs"
						mt="md"
						onClick={() => {
							setActivePage("billing");
						}}
					>
						Enter billing & payment details
					</Button>
				</Alert>
			</Collapse>

			<StepActions
				step={step}
				onPrevious={onPrevious}
				onContinue={handleContinue}
				disabled={!details.category || (details.category !== "free" && !hasBilling)}
			/>
		</Stack>
	);
}
