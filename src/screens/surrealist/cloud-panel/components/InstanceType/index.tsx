import { Box, Group, Stack, Table, Text } from "@mantine/core";
import { ReactNode } from "react";
import { Icon } from "~/components/Icon";
import type { CloudInstanceType } from "~/types";
import { formatMemory } from "~/util/helpers";
import { iconCheck } from "~/util/icons";
import { Tile, TileProps } from "../Tile";
import classes from "./style.module.scss";

export interface InstanceTypeProps extends Omit<TileProps, "children"> {
	type: CloudInstanceType;
	status?: ReactNode;
	isSelected: boolean;
	isActive?: boolean;
	inactive?: boolean;
	onBody?: boolean;
	onSelect?: (type: string) => void;
}

export function InstanceType({
	type,
	status,
	isSelected,
	isActive,
	inactive,
	onBody,
	onSelect,
	...other
}: InstanceTypeProps) {
	return (
		<Tile
			isActive={isSelected}
			onClick={onSelect ? () => onSelect(type.slug) : undefined}
			disabled={type.enabled === false || isActive}
			inactive={inactive}
			onBody={onBody}
			{...other}
		>
			<Group
				wrap="nowrap"
				align="center"
			>
				<Stack
					flex={1}
					gap={0}
				>
					{status}
					<Group>
						<Text
							c="bright"
							fw={600}
							fz={18}
						>
							{type.display_name}
						</Text>
						{isActive && (
							<Icon
								path={iconCheck}
								c="surreal"
							/>
						)}
					</Group>
				</Stack>
				<Box>
					<Table className={classes.table}>
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
