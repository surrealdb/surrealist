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
				px="xs"
				py={6}
				c="light.9"
				spacing="xs"
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
			<Box p="xs" className={classes.content}>
				{props.children}
			</Box>
		</Paper>
	);
}