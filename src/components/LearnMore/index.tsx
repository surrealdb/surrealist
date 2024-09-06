import { Anchor, type BoxProps, Group } from "@mantine/core";
import clsx from "clsx";
import type { HTMLAttributes, PropsWithChildren } from "react";
import { iconHelp } from "~/util/icons";
import { Icon } from "../Icon";
import classes from "./style.module.scss";

export interface LearnMoreProps
	extends BoxProps,
		Omit<HTMLAttributes<HTMLAnchorElement>, "style"> {
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
