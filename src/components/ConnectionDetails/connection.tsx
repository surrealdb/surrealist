import { ActionIcon, Box, Group, Popover, SimpleGrid, TextInput, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Updater } from "use-immer";
import { Connection } from "~/types";
import { iconServer } from "~/util/icons";
import { USER_ICONS } from "~/util/user-icons";
import { Icon } from "../Icon";

export interface ConnectionNameDetailsProps {
	value: Connection;
	onChange: Updater<Connection>;
}

export function ConnectionNameDetails({ value, onChange }: ConnectionNameDetailsProps) {
	const [showIcons, showIconsHandle] = useDisclosure();

	const isCloud = value.authentication.mode === "cloud";

	const updateIcon = (index: number) => {
		showIconsHandle.close();

		onChange((draft) => {
			draft.icon = index;
		});
	};

	return (
		<Group gap="md">
			<Box>
				<Popover
					opened={showIcons}
					onClose={showIconsHandle.close}
					position="bottom-start"
				>
					<Popover.Target>
						<Tooltip label="Customize icon">
							<ActionIcon
								variant="light"
								onClick={showIconsHandle.toggle}
								aria-label="Customize icon"
								size="lg"
							>
								<Icon
									path={USER_ICONS[value.icon]}
									size="lg"
								/>
							</ActionIcon>
						</Tooltip>
					</Popover.Target>
					<Popover.Dropdown>
						<SimpleGrid
							cols={8}
							spacing={4}
						>
							{USER_ICONS.map((icon, i) => (
								<ActionIcon
									key={i}
									variant={value.icon === i ? "gradient" : "subtle"}
									onClick={() => updateIcon(i)}
									aria-label={`Select icon ${i + 1}`}
								>
									<Icon path={icon} />
								</ActionIcon>
							))}
						</SimpleGrid>
					</Popover.Dropdown>
				</Popover>
			</Box>
			<TextInput
				flex={1}
				placeholder="Connection name"
				disabled={isCloud}
				value={value.name}
				onChange={(e) =>
					onChange((draft) => {
						draft.name = e.currentTarget.value;
					})
				}
			/>
		</Group>
	);
}
