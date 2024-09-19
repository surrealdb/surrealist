import { Group, Stack, Box, Text, Table } from "@mantine/core";
import { Spacer } from "~/components/Spacer";
import type { CloudInstanceType } from "~/types";
import { iconHammer, iconQuery, iconMemory } from "~/util/icons";
import { Tile } from "../Tile";
import { Icon } from "~/components/Icon";
import { capitalize } from "radash";

const CATEGORIES: Record<string, { name: string; icon: string }> = {
	development: {
		name: "Development",
		icon: iconHammer,
	},
	production: {
		name: "Production",
		icon: iconQuery,
	},
}

export interface InstanceTypeProps {
	type: CloudInstanceType;
	isActive?: boolean;
	inactive?: boolean;
	onSelect?: (type: string) => void;
}

export function InstanceType({ type, isActive, inactive, onSelect }: InstanceTypeProps) {

	const category = CATEGORIES[type.category];

	return (
		<Tile
			isActive={isActive}
			onClick={onSelect ? () => onSelect(type.slug) : undefined}
			disabled={type.enabled === false}
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
					{type.enabled === false && (
						<Text c="red">Not available in your current plan</Text>
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