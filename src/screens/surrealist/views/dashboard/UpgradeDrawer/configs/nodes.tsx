import {
	Alert,
	Box,
	Button,
	Divider,
	Group,
	Paper,
	ScrollArea,
	Slider,
	Stack,
	Text,
} from "@mantine/core";
import { useState } from "react";
import { navigate } from "wouter/use-browser-location";
import { useUpdateConfirmation } from "~/cloud/hooks/confirm";
import { useUpdateInstanceNodeMutation } from "~/cloud/mutations/node";
import { useCloudOrganizationQuery } from "~/cloud/queries/organizations";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { CloudInstance } from "~/types";
import { plural, showErrorNotification } from "~/util/helpers";
import { iconAuth } from "~/util/icons";
import classes from "../style.module.scss";

export interface ConfigurationNodesProps {
	instance: CloudInstance;
	onClose: () => void;
}

export function ConfigurationNodes({ instance, onClose }: ConfigurationNodesProps) {
	const { compute_units } = instance;
	const { data: organisation } = useCloudOrganizationQuery(instance.organization_id);

	const isResourcesLocked = organisation?.resources_locked ?? false;
	const [value, setValue] = useState<number>(compute_units);

	const minimum = instance.type.compute_units.min ?? 1;
	const maximum = instance.type.compute_units.max ?? 1;
	const midpoint = Math.ceil((maximum - minimum) / 2) + minimum;
	const hasChanged = value !== compute_units;

	const labelize = useStable((value: number) => {
		return `${value} ${plural(value, "Node", "Nodes")}`;
	});

	const marks = [minimum, midpoint, maximum].map((value) => ({
		value,
		label: labelize(value),
	}));

	const { mutateAsync } = useUpdateInstanceNodeMutation(instance);
	const confirmUpdate = useUpdateConfirmation(mutateAsync);

	const handleUpdate = useStable(() => {
		if (!isResourcesLocked) {
			onClose();
			confirmUpdate(value);
		} else {
			showErrorNotification({
				title: "Node configuration restricted",
				content:
					"Resource configurations within Surrealist are restricted for this organisation. In order to modify the number of compute nodes, please contact support.",
			});
		}
	});

	return (
		<Stack
			h="100%"
			gap={0}
		>
			<Divider />
			<Box
				pos="relative"
				flex={1}
			>
				<ScrollArea
					pos="absolute"
					inset={0}
					className={classes.scrollArea}
				>
					<Stack
						gap="sm"
						p="xl"
						mih="100%"
					>
						{isResourcesLocked && (
							<Alert
								mb="md"
								color="violet"
								title="Node configuration restricted"
								icon={<Icon path={iconAuth} />}
							>
								<Stack>
									Resource configurations within Surrealist are restricted for
									this organisation. In order to modify the number of compute
									nodes, please contact support.
									<Group>
										<Button
											size="xs"
											color="violet"
											variant="light"
											onClick={() => {
												navigate("/support");
											}}
										>
											Contact support
										</Button>
									</Group>
								</Stack>
							</Alert>
						)}
						<Box mb="xl">
							<Text
								fz="xl"
								c="bright"
								fw={600}
							>
								Modify compute nodes
							</Text>
							<Text
								mt="sm"
								fz="lg"
							>
								Adjust the number of compute nodes in your cluster to scale
								performance based on your workload needs. Increasing compute nodes
								adds more processing power, enabling your database to handle a
								higher volume of concurrent request and improve query
								responsiveness.
							</Text>
						</Box>
						<Paper
							p={42}
							withBorder={false}
						>
							<Slider
								mt="xl"
								h={40}
								min={minimum}
								max={maximum}
								step={1}
								disabled={isResourcesLocked}
								value={value}
								onChange={setValue}
								marks={marks}
								label={labelize}
								color="slate"
								styles={{
									label: {
										paddingInline: 10,
										fontSize: "var(--mantine-font-size-lg)",
										fontWeight: 600,
									},
								}}
							/>
						</Paper>
					</Stack>
				</ScrollArea>
			</Box>
			<Group p="xl">
				<Button
					onClick={onClose}
					color="slate"
					variant="light"
					flex={1}
				>
					Close
				</Button>
				<Button
					type="submit"
					variant="gradient"
					onClick={handleUpdate}
					flex={1}
					disabled={!hasChanged || isResourcesLocked}
				>
					Apply compute units
				</Button>
			</Group>
		</Stack>
	);
}
