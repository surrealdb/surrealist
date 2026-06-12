import { Box, BoxProps, Button, Image, Paper, Stack, Text } from "@mantine/core";
import { Icon, iconChevronRight, pictoSDBCloudGradient } from "@surrealdb/ui";
import { PropsWithChildren } from "react";
import glow from "~/assets/images/radial-glow.png";
import classes from "../style.module.scss";

export interface StartCloudProps extends BoxProps {
	action: string;
	image: string;
	onClick: () => void;
}

export function StartCloud({
	onClick,
	action,
	image,
	children,
	...other
}: PropsWithChildren<StartCloudProps>) {
	return (
		<Paper
			p="xl"
			pos="relative"
			className={classes.startCloud}
			{...other}
		>
			<Stack
				flex={1}
				pos="relative"
				style={{
					zIndex: 1,
				}}
			>
				<Text
					maw={450}
					fz="lg"
					className="selectable"
				>
					{children}
				</Text>
				<Box mt="md">
					<Button
						variant="gradient"
						rightSection={<Icon path={iconChevronRight} />}
						onClick={onClick}
					>
						{action}
					</Button>
				</Box>
			</Stack>
			<Image
				src={pictoSDBCloudGradient}
				className={classes.cloudImage}
			/>
			<Image
				src={glow}
				className={classes.cloudGlow}
			/>
		</Paper>
	);
}
