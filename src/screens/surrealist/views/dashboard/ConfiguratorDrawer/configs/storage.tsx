import classes from "../style.module.scss";

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
import { add, formatDistance } from "date-fns";
import { useMemo, useState } from "react";
import { useUpdateConfirmation } from "~/cloud/hooks/confirm";
import { useUpdateInstanceStorageMutation } from "~/cloud/mutations/storage";
import { Icon } from "~/components/Icon";
import { Link } from "~/components/Link";
import { useStable } from "~/hooks/stable";
import { CloudInstance } from "~/types";
import { iconChevronRight, iconClock, iconHelp, iconWarning } from "~/util/icons";

export interface ConfigurationStorageProps {
	instance: CloudInstance;
	onClose: () => void;
	onUpgrade: () => void;
}

export function ConfigurationStorage({ instance, onClose, onUpgrade }: ConfigurationStorageProps) {
	const { storage_size, storage_size_update_cooloff_hours, storage_size_updated_at } = instance;

	const [value, setValue] = useState(storage_size);

	const minimum = 0;
	const maximum = instance.type.max_storage_size;
	const midpoint = maximum / 2;
	const isMaximized = storage_size >= maximum;
	const isTooLow = value < storage_size;
	const isFree = instance.type.category === "free";

	const [isCoolingDown, timeLeft] = useMemo(() => {
		if (!storage_size_updated_at) {
			return [false, ""] as const;
		}

		const now = new Date();
		const lastUpdate = new Date(storage_size_updated_at);
		const cooldownPeroid = add(lastUpdate, {
			hours: storage_size_update_cooloff_hours,
		});

		if (cooldownPeroid > now) {
			const timeLeft = formatDistance(cooldownPeroid, now);

			return [true, timeLeft] as const;
		}

		return [false, ""] as const;
	}, [storage_size_updated_at, storage_size_update_cooloff_hours]);

	const isDisabled = isMaximized || isCoolingDown;

	const marks = [minimum, midpoint, maximum].map((value) => ({
		value,
		label: `${value} GB`,
	}));

	const { mutateAsync } = useUpdateInstanceStorageMutation(instance.id);
	const confirmUpdate = useUpdateConfirmation(mutateAsync);

	const handleUpdate = useStable(() => {
		onClose();
		confirmUpdate(value);
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

						{isFree ? (
							<Alert
								title="Upgrade your instance"
								color="red"
							>
								<Box>
									Disk size expansion is unavailable for free instances. Upgrade
									your instance to unlock the ability to increase your disk size.
								</Box>
								<Button
									mt="md"
									size="xs"
									rightSection={<Icon path={iconChevronRight} />}
									variant="gradient"
									onClick={onUpgrade}
								>
									Upgrade instance type
								</Button>
							</Alert>
						) : (
							<>
								{isMaximized ? (
									<Alert
										mb="md"
										color="slate"
										title="Disk size limit reached"
										icon={<Icon path={iconHelp} />}
									>
										If you require more storage space, please contact support at{" "}
										<Link href="mailto:support@surrealdb.com">
											support@surrealdb.com
										</Link>
									</Alert>
								) : (
									isCoolingDown && (
										<Alert
											mb="md"
											color="orange"
											title="Please wait"
											icon={<Icon path={iconClock} />}
										>
											You have recently updated your disk size. You can update
											it again in {timeLeft}.
										</Alert>
									)
								)}

								<Paper p={42}>
									<Slider
										min={minimum}
										max={maximum}
										step={1}
										value={value}
										onChange={setValue}
										marks={marks}
										label={(value) => `${value} GB`}
										disabled={isDisabled}
										color="slate"
										styles={{
											label: {
												paddingInline: 10,
												fontSize: "var(--mantine-font-size-lg)",
												fontWeight: 600,
											},
											bar: {
												background: isDisabled
													? "var(--mantine-color-slate-4)"
													: undefined,
											},
										}}
									/>
								</Paper>

								{isTooLow && (
									<Alert
										mt="md"
										color="red"
										title="Warning"
										icon={<Icon path={iconWarning} />}
									>
										You cannot decrease the storage size of your instance
									</Alert>
								)}
							</>
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
					onClick={handleUpdate}
					flex={1}
				>
					Increase storage size
				</Button>
			</Group>
		</Stack>
	);
}
