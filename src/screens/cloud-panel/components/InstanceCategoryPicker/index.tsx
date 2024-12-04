import { Alert, Box, BoxProps, Button, Collapse, Group, Text } from "@mantine/core";
import { Stack } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useAvailableInstanceTypes } from "~/hooks/cloud";
import { useActiveCloudPage } from "~/hooks/routing";
import { CloudOrganization } from "~/types";
import { iconChevronRight, iconHammer, iconQuery, iconStar, iconWarning } from "~/util/icons";
import { useCloudInstancesQuery } from "../../hooks/instances";
import { useCloudTypeLimits } from "../../hooks/limits";
import { Tile } from "../Tile";

export interface InstanceCategoryPickerProps extends BoxProps {
	organization: CloudOrganization;
	value?: string;
	onBody?: boolean;
	onChange?: (value: string) => void;
}

export function InstanceCategoryPicker({
	organization,
	value,
	onBody,
	onChange,
	...other
}: InstanceCategoryPickerProps) {
	const hasBilling = (organization?.billing_info && organization?.payment_info) ?? false;
	const instanceTypes = useAvailableInstanceTypes();
	const freeInstance = instanceTypes.find((t) => t.slug === "free");
	const instancesQuery = useCloudInstancesQuery(organization?.id);
	const isAvailable = useCloudTypeLimits(instancesQuery.data ?? []);
	const freeInstanceAvailable = freeInstance && isAvailable(freeInstance);
	const [, setActivePage] = useActiveCloudPage();

	return (
		<Stack {...other}>
			<Tile
				isActive={value === "production"}
				onClick={() => onChange?.("production")}
				onBody={onBody}
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
				isActive={value === "development"}
				onClick={() => onChange?.("development")}
				onBody={onBody}
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
				isActive={value === "free"}
				onClick={() => onChange?.("free")}
				disabled={!freeInstanceAvailable}
				onBody={onBody}
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

			<Collapse in={!!value && value !== "free" && !hasBilling}>
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
		</Stack>
	);
}
