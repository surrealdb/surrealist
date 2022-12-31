import { Box, Group, Paper, PaperProps, Text } from "@mantine/core";
import { useIsLight } from "~/hooks/theme";
import { Icon } from "../Icon";
import { Spacer } from "../Spacer";
import classes from './style.module.scss';

export interface PanelProps extends PaperProps {
	title: string;
	icon: string;
	rightSection?: React.ReactNode;
}

export function Panel(props: PanelProps) {
	const isLight = useIsLight();
	
	return (
		<Paper
			className={classes.root}
			bg={isLight ? 'white' : 'dark.7'}
		>
			<Group
				px="sm"
				py="xs"
				c={isLight ? 'light.9' : 'light.4'}
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