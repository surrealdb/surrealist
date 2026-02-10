import { BoxProps, Group, Text, ThemeIcon } from "@mantine/core";
import { Icon } from "@surrealdb/ui";
import { ReactNode } from "react";

export interface PropertyValueProps extends BoxProps {
	title: string;
	icon: string;
	value: ReactNode;
}

export function PropertyValue({ title, icon, value, ...other }: PropertyValueProps) {
	return (
		<Group
			gap="sm"
			h={32}
			wrap="nowrap"
			miw={0}
			{...other}
		>
			<ThemeIcon
				color="slate"
				radius="xs"
				variant="light"
			>
				<Icon path={icon} />
			</ThemeIcon>
			<Group
				gap="xs"
				wrap="nowrap"
				miw={0}
			>
				<Text fw={600}>{title}: </Text>
				<Text
					c="bright"
					truncate
				>
					{value}
				</Text>
			</Group>
		</Group>
	);
}
