import { Text } from "@mantine/core";
import { Group, Box, Title } from "@mantine/core";
import { PropsWithChildren } from "react";

export interface SectionProps {
	isLight: boolean;
	title: string;
	description: string;
}

export function Section(props: PropsWithChildren<SectionProps>) {
	return (
		<Group
			align="flex-start"
			spacing={40}
			maw={850}
		>
			<Box w={250}>
				<Title size={18} color={props.isLight ? 'light.8' : 'white'}>
					{props.title}
				</Title>
				<Text color={props.isLight ? 'light.3' : 'light.4'} size="sm" mt={2}>
					{props.description}
				</Text>
			</Box>
			<Box style={{ flex: 1 }}>
				{props.children}
			</Box>
		</Group>
	)
}