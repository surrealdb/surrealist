import cloudSplashUrl from "~/assets/images/cloud-splash.webp";
import classes from "../style.module.scss";

import { Image, Text } from "@mantine/core";
import { BoxProps, Group, Paper, Stack, UnstyledButton } from "@mantine/core";
import { PropsWithChildren, useRef } from "react";
import { Faint } from "~/components/Faint";
import { Icon } from "~/components/Icon";
import { iconArrowLeft } from "~/util/icons";

export interface StartCloudProps extends BoxProps {
	action: string;
	onClick: () => void;
}

export function StartCloud({
	onClick,
	action,
	children,
	...other
}: PropsWithChildren<StartCloudProps>) {
	const containerRef = useRef<HTMLDivElement>(null);

	return (
		<UnstyledButton
			onClick={onClick}
			{...other}
		>
			<Paper
				p="xl"
				pos="relative"
				variant="interactive"
				ref={containerRef}
				className={classes.startCloud}
				renderRoot={(props) => <Stack {...props} />}
				withBorder
				mih={145}
			>
				<Text
					maw={450}
					fz="lg"
				>
					{children}
				</Text>
				<Group gap="xs">
					<Text c="surreal">{action}</Text>
					<Icon
						className={classes.startCloudArrow}
						path={iconArrowLeft}
						c="surreal"
					/>
				</Group>
				<Image
					src={cloudSplashUrl}
					className={classes.cloudImage}
				/>
				<Faint containerRef={containerRef} />
			</Paper>
		</UnstyledButton>
	);
}
