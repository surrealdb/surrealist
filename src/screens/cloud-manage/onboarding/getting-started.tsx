import logoDarkUrl from "~/assets/images/dark/cloud-logo.svg";
import communtyDarkUrl from "~/assets/images/dark/picto-community.svg";
import documentationDarkUrl from "~/assets/images/dark/picto-documentation.svg";
import tutorialDarkUrl from "~/assets/images/dark/picto-tutorial.svg";
import glowUrl from "~/assets/images/gradient-glow.webp";
import logoLightUrl from "~/assets/images/light/cloud-logo.svg";
import communtyLightUrl from "~/assets/images/light/picto-community.svg";
import documentationLightUrl from "~/assets/images/light/picto-documentation.svg";
import tutorialLightUrl from "~/assets/images/light/picto-tutorial.svg";

import { Button, Group, Image, Paper, Stack, Text } from "@mantine/core";
import { closeAllModals, openModal } from "@mantine/modals";
import { Icon } from "~/components/Icon";
import { Link } from "~/components/Link";
import { Spacer } from "~/components/Spacer";
import { getIsLight, useIsLight, useThemeImage } from "~/hooks/theme";
import { iconChevronRight } from "~/util/icons";

export function openStartingModal() {
	openModal({
		size: 525,
		children: <StartingModal />,
		styles: {
			body: {
				backgroundImage: `url(${glowUrl})`,
				backgroundPosition: `center ${getIsLight() ? -150 : 0}px`,
				backgroundRepeat: "no-repeat",
				backgroundSize: 900
			},
		},
	});
}

function StartingModal() {
	const isLight = useIsLight();

	const logoUrl = useThemeImage({
		light: logoLightUrl,
		dark: logoDarkUrl,
	});

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

	return (
		<Stack gap="xl">
			<Image
				src={logoUrl}
				mx="auto"
				my={28}
				maw={400}
			/>
			<Text
				fz="lg"
				c="bright"
			>
				Welcome to Surreal Cloud! We are excited to have you on board. Before you get
				started, feel free to explore our documentation to learn more about our features and
				capabilities.
			</Text>
			<Stack mt="xl">
				<GettingStartedLink
					image={tutorialUrl}
					title="Introduction video"
					href="https://youtube.com/@SurrealDB"
				/>

				<GettingStartedLink
					image={documentationUrl}
					title="Cloud Documentation"
					href="https://surrealdb.com/docs/cloud"
				/>

				<GettingStartedLink
					image={communtyUrl}
					title="Community"
					href="https://surrealdb.com/community"
				/>
			</Stack>
			<Group>
				<Button
					fullWidth
					color="slate"
					variant="gradient"
					rightSection={<Icon path={iconChevronRight} />}
					onClick={() => {
						closeAllModals();
						localStorage.setItem("surrealist:onboarded", "true");
					}}
				>
					Get started
				</Button>
			</Group>
		</Stack>
	);
}

interface GettingStartedLinkProps {
	image: string;
	title: string;
	href: string;
}

function GettingStartedLink({ image, title, href }: GettingStartedLinkProps) {
	const isLight = useIsLight();

	return (
		<Link href={href}>
			<Paper
				px="md"
				py="xl"
				radius="md"
				bg={isLight ? "slate.0" : "slate.9"}
			>
				<Group>
					<Image
						src={image}
						w={32}
						h={32}
					/>
					<Text
						c="bright"
						fz="lg"
						fw={500}
					>
						{title}
					</Text>
					<Spacer />
					<Icon
						path={iconChevronRight}
						size="xl"
						c="slate"
					/>
				</Group>
			</Paper>
		</Link>
	);
}