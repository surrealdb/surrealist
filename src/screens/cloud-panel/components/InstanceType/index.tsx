import { Box, Group, Stack, Table, Text } from "@mantine/core";
import { Icon } from "~/components/Icon";
import type { CloudInstanceType } from "~/types";
import { formatMemory } from "~/util/helpers";
import { iconWarning } from "~/util/icons";
import { Tile } from "../Tile";

export interface InstanceTypeProps {
	type: CloudInstanceType;
	isActive?: boolean;
	isLimited?: boolean;
	inactive?: boolean;
	onBody?: boolean;
	onSelect?: (type: string) => void;
}

export function InstanceType({
	type,
	isActive,
	isLimited,
	inactive,
	onBody,
	onSelect,
}: InstanceTypeProps) {
	return (
		<Tile
			isActive={isActive}
			onClick={onSelect ? () => onSelect(type.slug) : undefined}
			disabled={type.enabled === false || isLimited}
			inactive={inactive}
			onBody={onBody}
		>
			<Group
				wrap="nowrap"
				align="center"
			>
				<Stack
					flex={1}
					gap={0}
				>
					<Group>
						<Text
							c="bright"
							fw={600}
							fz="xl"
						>
							{type.display_name}
						</Text>
					</Group>
					{type.enabled === false ? (
						<Text c="red">Not available in your current plan</Text>
					) : (
						isLimited && (
							<Group
								gap="xs"
								mt="lg"
								c="orange"
							>
								<Icon path={iconWarning} />
								<Text size="sm">
									Maximum amount of instances of this type in use
								</Text>
							</Group>
						)
					)}
				</Stack>
				<Box>
					<Table>
						<Table.Tbody>
							<Table.Tr>
								<Table.Td
									c="bright"
									miw={45}
									ta="right"
								>
									{type.cpu}
								</Table.Td>
								<Table.Td>
									<Group>vCPU</Group>
								</Table.Td>
							</Table.Tr>
							<Table.Tr>
								<Table.Td
									c="bright"
									miw={45}
									ta="right"
								>
									{formatMemory(type.memory)}
								</Table.Td>
								<Table.Td>
									<Group>Memory</Group>
								</Table.Td>
							</Table.Tr>
						</Table.Tbody>
					</Table>
				</Box>
			</Group>
		</Tile>
	);
}
