import {
	Box,
	Divider,
	Group,
	Paper,
	type PaperProps,
	Text,
} from "@mantine/core";
import clsx from "clsx";
import type { HTMLAttributes } from "react";
import { useIsLight } from "~/hooks/theme";
import { Icon } from "../Icon";
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
	disabled,
	...rest
}: ContentPaneProps) {
	const isLight = useIsLight();

	return (
		<Paper
			radius="lg"
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
								c={isLight ? "slate.4" : "slate.3"}
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
					<Divider mx="sm" className={classes.divider} />
				</>
			)}
			<Box
				p="sm"
				pt={0}
				mt={withTopPadding === false ? undefined : "sm"}
				pos="relative"
				className={classes.content}
			>
				{children}
			</Box>
		</Paper>
	);
}
