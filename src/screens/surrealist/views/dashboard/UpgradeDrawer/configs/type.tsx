import classes from "../style.module.scss";

import { Box, Button, Divider, Group, ScrollArea, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { INSTANCE_CATEGORY_PLANS } from "~/cloud/helpers";
import { useUpdateConfirmation } from "~/cloud/hooks/confirm";
import { useUpdateInstanceTypeMutation } from "~/cloud/mutations/type";
import { InstanceTypes } from "~/components/InstanceTypes";
import { useStable } from "~/hooks/stable";
import { CloudInstance, CloudOrganization } from "~/types";

export interface ConfigurationInstanceTypeProps {
	instance: CloudInstance;
	organisation: CloudOrganization;
	onClose: () => void;
}

export function ConfigurationInstanceType({
	instance,
	organisation,
	onClose,
}: ConfigurationInstanceTypeProps) {
	const [selected, setSelected] = useState("");

	const { mutateAsync } = useUpdateInstanceTypeMutation(instance);
	const instanceType = instance.type.slug;
	const confirmUpdate = useUpdateConfirmation(mutateAsync);

	const guessedPlan = INSTANCE_CATEGORY_PLANS[instance.type.category];

	const handleUpdate = useStable(() => {
		onClose();
		confirmUpdate(selected);
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
						<Box mb="xl">
							<Text
								fz="xl"
								c="bright"
								fw={600}
							>
								Change instance type
							</Text>

							<Text
								mt="sm"
								fz="lg"
							>
								Change the active instance type to adjust the resources available to
								your instance, including memory and CPU.
							</Text>
						</Box>
						{organisation && (
							<InstanceTypes
								value={selected}
								active={instanceType}
								plan={guessedPlan}
								organization={organisation}
								onChange={(type) => setSelected(type.slug)}
							/>
						)}
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
					flex={1}
					type="submit"
					variant="gradient"
					disabled={!selected}
					onClick={handleUpdate}
				>
					Apply instance type
				</Button>
			</Group>
		</Stack>
	);
}
