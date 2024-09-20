import { Box, Group, Stack, Table, Text } from "@mantine/core";
import { capitalize } from "radash";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import type { CloudInstanceType } from "~/types";
import { iconHammer, iconMemory, iconQuery } from "~/util/icons";
import { Tile } from "../Tile";

const CATEGORIES: Record<string, { name: string; icon: string }> = {
	development: {
		name: "Development",
		icon: iconHammer,
	},
	production: {
		name: "Production",
		icon: iconQuery,
	},
};

export interface InstanceTypeProps {
	type: CloudInstanceType;
	isActive?: boolean;
	isLimited?: boolean;
	inactive?: boolean;
	onSelect?: (type: string) => void;
}

export function InstanceType({ type, isActive, isLimited, inactive, onSelect }: InstanceTypeProps) {
	const category = CATEGORIES[type.category];

	return (
		<Tile
			isActive={isActive}
			onClick={onSelect ? () => onSelect(type.slug) : undefined}
			disabled={type.enabled === false || isLimited}
			inactive={inactive}
		>
			<Group
				wrap="nowrap"
				align="stretch"
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
							{type.slug}
						</Text>
					</Group>
					{type.enabled === false ? (
						<Text c="red">Not available in your current plan</Text>
					) : isLimited && (
						<Text c="orange">You have reached the maximum amount of instances of this type</Text>
					)}
					<Spacer />
					{category && (
						<Text>
							<Icon
								path={category.icon}
								left
								size="sm"
							/>
							{capitalize(category.name)}
						</Text>
					)}
				</Stack>
				<Box>
					<Table>
						<Table.Tbody>
							<Table.Tr>
								<Table.Td>
									<Group>
										<Icon path={iconQuery} />
										vCPU
									</Group>
								</Table.Td>
								<Table.Td
									c="bright"
									miw={75}
									ta="right"
								>
									{type.cpu}
								</Table.Td>
							</Table.Tr>
							<Table.Tr>
								<Table.Td>
									<Group>
										<Icon path={iconMemory} />
										Memory
									</Group>
								</Table.Td>
								<Table.Td
									c="bright"
									miw={75}
									ta="right"
								>
									{type.memory} MB
								</Table.Td>
							</Table.Tr>
						</Table.Tbody>
					</Table>
				</Box>
			</Group>
		</Tile>
	);
}
