import classes from "./style.module.scss";
import { Anchor, BoxProps, Group } from "@mantine/core";
import { HTMLAttributes, PropsWithChildren } from "react";
import { Icon } from "../Icon";
import { iconHelp } from "~/util/icons";
import clsx from "clsx";

export interface LearnMoreProps extends BoxProps, Omit<HTMLAttributes<HTMLAnchorElement>, 'style'> {
	href: string;
}

export function LearnMore({
	children,
	href,
	className,
	...other
}: PropsWithChildren<LearnMoreProps>) {
	return (
		<Anchor
			href={href}
			underline="never"
			className={clsx(classes.root, className)}
			{...other}
		>
			<Group gap="sm">
				<Icon path={iconHelp} />
				{children}
			</Group>
		</Anchor>
	);
}