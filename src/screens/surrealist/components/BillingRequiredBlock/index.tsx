import { BoxProps, Image, Paper, Stack, Text } from "@mantine/core";
import { PropsWithChildren, ReactNode } from "react";
import glowImage from "~/assets/images/glow.png";
import cloudImage from "~/assets/images/icons/cloud.png";
import classes from "./style.module.scss";

export interface BillingRequiredBlockProps extends BoxProps {
	title: string;
	subtitle: ReactNode;
}

export function BillingRequiredBlock({
	title,
	subtitle,
	...other
}: PropsWithChildren<BillingRequiredBlockProps>) {
	return (
		<Paper
			p="xl"
			pos="relative"
			variant="gradient"
			className={classes.cloud}
			{...other}
		>
			<Stack flex={1}>
				<Text
					fz="xl"
					c="bright"
					fw="bold"
					maw={450}
				>
					{title}
				</Text>
				{subtitle}
			</Stack>
			<Image
				src={cloudImage}
				className={classes.cloudImage}
			/>
			<Image
				src={glowImage}
				className={classes.cloudGlow}
			/>
		</Paper>
	);
}
