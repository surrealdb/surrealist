import { Box, Button, Divider, Group, ScrollArea, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { INSTANCE_CATEGORY_PLANS } from "~/cloud/helpers";
import { useUpdateConfirmation } from "~/cloud/hooks/confirm";
import { useUpdateInstanceTypeMutation } from "~/cloud/mutations/type";
import { InstanceTypes } from "~/components/InstanceTypes";
import { useStable } from "~/hooks/stable";
import { CloudInstance, CloudOrganization } from "~/types";
import classes from "../style.module.scss";

export interface ConfigurationInstanceTypeProps {
	instance: CloudInstance;
	organisation: CloudOrganization;
	onClose: () => void;
	variant?: "drawer" | "page";
	selectedType?: string;
	onSelectedTypeChange?: (type: string) => void;
	hideFooter?: boolean;
}

export function ConfigurationInstanceType({
	instance,
	organisation,
	onClose,
	variant = "drawer",
	selectedType: controlledSelected,
	onSelectedTypeChange,
	hideFooter = false,
}: ConfigurationInstanceTypeProps) {
	const [internalSelected, setInternalSelected] = useState("");
	const selected = controlledSelected ?? internalSelected;

	const setSelected = useStable((type: string) => {
		if (onSelectedTypeChange) {
			onSelectedTypeChange(type);
		} else {
			setInternalSelected(type);
		}
	});

	const { mutateAsync } = useUpdateInstanceTypeMutation(instance);
	const instanceType = instance.type.slug;
	const confirmUpdate = useUpdateConfirmation(mutateAsync);

	const guessedPlan = INSTANCE_CATEGORY_PLANS[instance.type.category];

	const handleUpdate = useStable(() => {
		if (variant === "drawer") {
			onClose();
		}

		confirmUpdate(selected);
	});

	const content = (
		<Stack
			gap="sm"
			p={variant === "drawer" ? "xl" : undefined}
			mih={variant === "drawer" ? "100%" : undefined}
		>
			{variant === "drawer" && (
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
						Change the active instance type to adjust the resources available to your
						instance, including memory and CPU.
					</Text>
				</Box>
			)}
			{organisation && (
				<InstanceTypes
					value={selected}
					active={instanceType === "free" ? "development" : instanceType}
					plan={guessedPlan}
					columns={2}
					organization={organisation}
					onChange={(type) => setSelected(type.slug)}
				/>
			)}
		</Stack>
	);

	const footer = !hideFooter && (
		<Group p={variant === "drawer" ? "xl" : undefined}>
			{variant === "drawer" && (
				<Button
					onClick={onClose}
					color="obsidian"
					variant="light"
					flex={1}
				>
					Close
				</Button>
			)}
			<Button
				flex={variant === "drawer" ? 1 : undefined}
				type="submit"
				variant="gradient"
				disabled={!selected}
				onClick={handleUpdate}
			>
				Apply instance type
			</Button>
		</Group>
	);

	if (variant === "page") {
		return (
			<Stack gap="md">
				{content}
				{footer}
			</Stack>
		);
	}

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
					{content}
				</ScrollArea>
			</Box>

			{footer}
		</Stack>
	);
}
