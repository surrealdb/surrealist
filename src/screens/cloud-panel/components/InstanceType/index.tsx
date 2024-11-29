import { Box, Group, Stack, Table, Text } from "@mantine/core";
import { capitalize } from "radash";
import { Icon } from "~/components/Icon";
import type { CloudInstanceType } from "~/types";
import { iconHammer, iconMemory, iconQuery, iconStar, iconWarning } from "~/util/icons";
import { Tile } from "../Tile";

const CATEGORIES: Record<string, { name: string; icon: string }> = {
	free: {
		name: "Free",
		icon: iconStar,
	},
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
							{type.display_name || type.slug}
						</Text>
					</Group>
					{category && (
						<Text mt="xs">
							<Icon
								path={category.icon}
								left
								size="sm"
							/>
							{capitalize(category.name)}
						</Text>
					)}
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
									{formatMemory(type.memory)}
								</Table.Td>
							</Table.Tr>
						</Table.Tbody>
					</Table>
				</Box>
			</Group>
		</Tile>
	);
}

function formatMemory(amountInMB: number) {
	if (amountInMB < 1000) {
		return `${amountInMB} MB`;
	}

	return `${amountInMB / 1024} GB`;
}
