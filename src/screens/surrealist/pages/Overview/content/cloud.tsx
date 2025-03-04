import cloudSplashUrl from "~/assets/images/cloud-splash.webp";
import classes from "../style.module.scss";

import { Image, Text } from "@mantine/core";
import { BoxProps, Group, Paper, Stack, UnstyledButton } from "@mantine/core";
import clsx from "clsx";
import { ReactNode, useRef } from "react";
import { Faint } from "~/components/Faint";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";

export interface StartCloudProps extends BoxProps {
	title: ReactNode;
	subtitle: ReactNode;
	icon?: string;
	onClick: () => void;
}

export function StartCloud({ title, subtitle, icon, onClick, ...other }: StartCloudProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	return (
		<UnstyledButton
			onClick={onClick}
			{...other}
		>
			<Paper
				p="xl"
				pos="relative"
				ref={containerRef}
				className={clsx(classes.startBox, classes.startCloud)}
				renderRoot={(props) => <Stack {...props} />}
			>
				<Group
					wrap="nowrap"
					align="start"
					h="100%"
				>
					<Text
						c="bright"
						fw={600}
						fz="xl"
					>
						{title}
					</Text>
					<Spacer />
					{icon && (
						<Icon
							className={classes.startCloudIcon}
							path={icon}
							size="xl"
						/>
					)}
				</Group>
				<Text maw={450}>{subtitle}</Text>
				<Image
					src={cloudSplashUrl}
					className={classes.cloudImage}
				/>
				<Faint containerRef={containerRef} />
			</Paper>
		</UnstyledButton>
	);
}
