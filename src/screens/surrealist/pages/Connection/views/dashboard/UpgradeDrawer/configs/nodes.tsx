import { Box, Button, Divider, Group, Paper, ScrollArea, Slider, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { useUpdateConfirmation } from "~/cloud/hooks/confirm";
import { useUpdateInstanceNodeMutation } from "~/cloud/mutations/node";
import { useStable } from "~/hooks/stable";
import { CloudInstance } from "~/types";
import { plural } from "~/util/helpers";
import classes from "../style.module.scss";

export interface ConfigurationNodesProps {
	instance: CloudInstance;
	onClose: () => void;
	variant?: "drawer" | "page";
}

export function ConfigurationNodes({
	instance,
	onClose,
	variant = "drawer",
}: ConfigurationNodesProps) {
	const { compute_units } = instance;
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
		if (variant === "drawer") {
			onClose();
		}

		confirmUpdate(value);
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
						Modify compute nodes
					</Text>
					<Text
						mt="sm"
						fz="lg"
					>
						Adjust the number of compute nodes in your cluster to scale performance
						based on your workload needs. Increasing compute nodes adds more processing
						power, enabling your database to handle a higher volume of concurrent
						request and improve query responsiveness.
					</Text>
				</Box>
			)}
			<Paper
				p={variant === "drawer" ? 42 : "md"}
				withBorder={false}
			>
				<Slider
					mt={variant === "drawer" ? "xl" : undefined}
					h={40}
					min={minimum}
					max={maximum}
					step={1}
					value={value}
					onChange={setValue}
					marks={marks}
					label={labelize}
					color="violet"
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
	);

	const footer = (
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
				type="submit"
				variant="gradient"
				onClick={handleUpdate}
				flex={variant === "drawer" ? 1 : undefined}
				disabled={!hasChanged}
			>
				Apply compute units
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
