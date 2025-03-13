import classes from "../style.module.scss";

import { Alert, Box, Button, Divider, Group, ScrollArea, Slider, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { Icon } from "~/components/Icon";
import { CloudInstance } from "~/types";
import { iconCancel, iconWarning } from "~/util/icons";

export interface ConfigurationStorageProps {
	instance: CloudInstance;
	onClose: () => void;
}

export function ConfigurationStorage({ instance, onClose }: ConfigurationStorageProps) {
	const [value, setValue] = useState(instance.storage_size);

	const minimum = 1;
	const maximum = instance.type.max_storage_size;
	const halfMaximum = maximum / 2;
	const isMaximized = instance.storage_size >= maximum;
	const isTooLow = value < instance.storage_size;

	const marks = [minimum, halfMaximum, maximum].map((value) => ({
		value,
		label: `${value} GB`,
	}));

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
								Increase disk size
							</Text>

							<Text
								mt="sm"
								fz="lg"
							>
								You can increase your disk size to store more data within your
								database.
							</Text>
						</Box>

						{isMaximized ? (
							<Alert
								title="Limit reached"
								icon={<Icon path={iconCancel} />}
							>
								You have reached the maximum storage size for this instance type
							</Alert>
						) : (
							<Slider
								min={minimum}
								max={maximum}
								step={1}
								value={value}
								onChange={setValue}
								marks={marks}
							/>
						)}

						{isTooLow && (
							<Alert
								mt="xl"
								color="red"
								title="Warning"
								icon={<Icon path={iconWarning} />}
							>
								You cannot decrease the storage size below your current size
							</Alert>
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
					type="submit"
					variant="gradient"
					disabled={isMaximized || isTooLow || value === instance.storage_size}
					flex={1}
				>
					Increase storage size
				</Button>
			</Group>
		</Stack>
	);
}
