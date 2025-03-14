import classes from "./style.module.scss";

import communtyDarkUrl from "~/assets/images/dark/picto-community.svg";
import documentationDarkUrl from "~/assets/images/dark/picto-documentation.svg";
import tutorialDarkUrl from "~/assets/images/dark/picto-tutorial.svg";
import communtyLightUrl from "~/assets/images/light/picto-community.svg";
import documentationLightUrl from "~/assets/images/light/picto-documentation.svg";
import tutorialLightUrl from "~/assets/images/light/picto-tutorial.svg";

import { Box, Center, Image, Loader, Paper, SimpleGrid, Stack, Text } from "@mantine/core";

import { useIsLight, useThemeImage } from "~/hooks/theme";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { iconSurreal } from "~/util/icons";
import { Link } from "~/components/Link";
import { useEffect } from "react";
import { useCloudInstanceQuery } from "~/cloud/queries/instances";
import { useConnectionNavigator } from "~/hooks/routing";
import { resolveInstanceConnection } from "~/util/connection";
import { CloudInstance } from "~/types";

export interface ProvisionPollerProps {
	instance: CloudInstance;
}

export function ProvisionPoller({ instance }: ProvisionPollerProps) {
	const isLight = useIsLight();
	const navigateConnection = useConnectionNavigator();

	const tutorialUrl = useThemeImage({
		dark: tutorialDarkUrl,
		light: tutorialLightUrl,
	});

	const documentationUrl = useThemeImage({
		dark: documentationDarkUrl,
		light: documentationLightUrl,
	});

	const communtyUrl = useThemeImage({
		dark: communtyDarkUrl,
		light: communtyLightUrl,
	});

	const { data, isSuccess } = useCloudInstanceQuery(instance.id, 1000);

	useEffect(() => {
		if (isSuccess && data.state !== "creating") {
			const connection = resolveInstanceConnection(instance);

			navigateConnection(connection.id, "dashboard");
		}
	}, [isSuccess, data?.state, instance]);

	return (
		<Box
			mx="auto"
			maw={650}
			py={52}
		>
			<Center
				className={classes.provisionBox}
				pos="relative"
				mx="auto"
				w={112}
				h={112}
			>
				<Loader
					className={classes.provisionLoader}
					inset={0}
					size="100%"
					pos="absolute"
				/>
				<svg
					viewBox="0 0 24 24"
					className={classes.provisionIcon}
				>
					<title>Loading spinner</title>
					<path
						d={iconSurreal}
						fill={isLight ? "black" : "white"}
					/>
				</svg>
			</Center>

			<Box
				ta="center"
				my={38}
			>
				<PrimaryTitle>Provisioning your Cloud Instance...</PrimaryTitle>

				<Text
					fz="xl"
					mt="sm"
				>
					While you wait, feel free to explore Surreal Cloud
				</Text>
			</Box>

			<SimpleGrid cols={3}>
				<GettingStartedLink
					title="Cloud Documentation"
					description="Learn more about Surreal Cloud features and capabilities"
					image={documentationUrl}
					href="https://surrealdb.com/docs/cloud"
				/>
				<GettingStartedLink
					title="Join the Community"
					description="Get help from the community and share your experiences"
					image={communtyUrl}
					href="https://surrealdb.com/community"
				/>
				<GettingStartedLink
					title="Quick Start Tutorial"
					description="Watch a quick tutorial to get started with Surreal Cloud"
					image={tutorialUrl}
					href="https://www.youtube.com/watch?v=upm1lwaHmwU"
				/>
			</SimpleGrid>
		</Box>
	);
}

interface GettingStartedLinkProps {
	image: string;
	title: string;
	description: string;
	href: string;
}

function GettingStartedLink({ image, description, title, href }: GettingStartedLinkProps) {
	const isLight = useIsLight();

	return (
		<Link
			href={href}
			underline={false}
			c="unset"
		>
			<Paper
				px="md"
				py="xl"
				radius="md"
			>
				<Stack align="center">
					<Image
						src={image}
						w={42}
						h={42}
					/>
					<Text
						c="bright"
						fz="lg"
						fw={500}
					>
						{title}
					</Text>
					<Text ta="center">{description}</Text>
				</Stack>
			</Paper>
		</Link>
	);
}
