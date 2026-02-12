import { Box, Divider, Group, Paper, type PaperProps, Text } from "@mantine/core";
import { Icon } from "@surrealdb/ui";
import clsx from "clsx";
import type { HTMLAttributes } from "react";
import { useIsLight } from "~/hooks/theme";
import { Spacer } from "../Spacer";
import classes from "./style.module.scss";

export interface ContentPaneProps
	extends PaperProps,
		Omit<HTMLAttributes<HTMLDivElement>, "style"> {
	title?: string;
	icon?: string;
	leftSection?: React.ReactNode;
	infoSection?: React.ReactNode;
	rightSection?: React.ReactNode;
	withTopPadding?: boolean;
	withDivider?: boolean;
	disabled?: boolean;
}

export function ContentPane({
	children,
	title,
	icon,
	className,
	leftSection,
	infoSection,
	rightSection,
	withTopPadding,
	withDivider,
	disabled,
	...rest
}: ContentPaneProps) {
	const isLight = useIsLight();

	return (
		<Paper
			className={clsx(classes.root, className)}
			pos="relative"
			opacity={disabled ? 0.5 : 1}
			style={{ pointerEvents: disabled ? "none" : undefined }}
			{...rest}
		>
			{(title || icon || leftSection || rightSection || infoSection) && (
				<>
					<Group
						px="sm"
						py="xs"
						gap="xs"
						h={48}
						wrap="nowrap"
						className={classes.header}
					>
						{leftSection}
						{icon && (
							<Icon
								path={icon}
								c={isLight ? "obsidian.4" : "obsidian.3"}
							/>
						)}
						<Text
							fw={600}
							c="bright"
							className={classes.title}
							style={{ flexShrink: 0 }}
						>
							{title}
						</Text>
						{infoSection}
						<Spacer />
						{rightSection}
					</Group>
					{withDivider !== false && (
						<Divider
							mx="sm"
							mt={2}
							className={classes.divider}
						/>
					)}
				</>
			)}
			{children && (
				<Box
					p="sm"
					pt={0}
					mt={withTopPadding === false || withDivider === false ? undefined : "sm"}
					pos="relative"
					className={classes.content}
				>
					{children}
				</Box>
			)}
		</Paper>
	);
}
