import { Box, Divider, Group, Paper, PaperProps, Text } from "@mantine/core";
import { HTMLAttributes } from "react";
import { useIsLight } from "~/hooks/theme";
import { Icon } from "../Icon";
import { Spacer } from "../Spacer";
import classes from "./style.module.scss";

export interface ContentPaneProps extends PaperProps, Omit<HTMLAttributes<HTMLDivElement>, "style"> {
	title?: string;
	icon?: string;
	leftSection?: React.ReactNode;
	rightSection?: React.ReactNode;
}

export function ContentPane(props: ContentPaneProps) {
	const { children, title, icon, leftSection, rightSection, ...rest } = props;

	const isLight = useIsLight();

	return (
		<Paper
			radius="lg"
			className={classes.root}
			{...rest}
		>
			{title !== undefined && icon !== undefined && (
				<>
					<Group
						px="sm"
						py="xs"
						gap="xs"
						h={48}
						wrap="nowrap"
						className={classes.header}
					>
						{icon && <Icon path={icon} c={isLight ? "slate.4" : "slate.3"} />}
						<Text
							fw={600}
							c="bright"
							className={classes.title}
						>
							{title}
						</Text>
						{leftSection}
						<Spacer />
						{rightSection}
					</Group>
					<Divider
						mx="sm"
						mb="sm"
						className={classes.divider}
					/>
				</>
			)}
			<Box
				p="sm"
				pt={0}
				pos="relative"
				className={classes.content}
			>
				{children}
			</Box>
		</Paper>
	);
}
