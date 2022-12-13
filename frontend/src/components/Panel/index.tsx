import { Box, Divider, Group, Paper, PaperProps, Text } from "@mantine/core";
import { Icon } from "../Icon";
import { Spacer } from "../Scaffold/Spacer";
import classes from './style.module.scss';

export interface PanelProps extends PaperProps {
	title: string;
	icon: string;
	rightSection?: React.ReactNode;
}

export function Panel(props: PanelProps) {
	return (
		<Paper className={classes.root}>
			<Group
				px="sm"
				py="xs"
				c="light.9"
				spacing="xs"
				noWrap
			>
				<Icon
					path={props.icon}
				/>
				<Text weight={600}>
					{props.title}
				</Text>
				<Spacer />
				{props.rightSection}
			</Group>
			<Box
				p="sm"
				pt={0}
				pos="relative"
				className={classes.content}
			>
				{props.children}
			</Box>
		</Paper>
	);
}