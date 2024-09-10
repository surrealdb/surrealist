import classes from "./style.module.scss";

import communtyDarkUrl from "~/assets/images/dark/picto-community.svg";
import discordDarkUrl from "~/assets/images/dark/picto-discord.svg";
import documentationDarkUrl from "~/assets/images/dark/picto-documentation.svg";
import communtyLightUrl from "~/assets/images/light/picto-community.svg";
import discordLightUrl from "~/assets/images/light/picto-discord.svg";
import documentationLightUrl from "~/assets/images/light/picto-documentation.svg";

import { type BoxProps, Image, Text, UnstyledButton } from "@mantine/core";
import { Center, Group, Paper, Stack } from "@mantine/core";
import { adapter } from "~/adapter";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useThemeImage } from "~/hooks/theme";
import { iconChevronRight } from "~/util/icons";

interface SupportTileProps extends BoxProps {
	image: string;
	title: string;
	onClick?: () => void;
}

function SupportTile({ image, title, onClick, ...props }: SupportTileProps) {
	return (
		<UnstyledButton onClick={onClick}>
			<Paper
				p="lg"
				className={classes.tile}
				{...props}
			>
				<Group>
					<Image
						src={image}
						w={42}
						h={42}
					/>
					<Text
						flex={1}
						c="bright"
						ml="sm"
						fz="lg"
						fw={500}
					>
						{title}
					</Text>
					<Icon
						path={iconChevronRight}
						c="slate"
						size="xl"
					/>
				</Group>
			</Paper>
		</UnstyledButton>
	);
}

export function SupportPage() {
	const discordUrl = useThemeImage({
		dark: discordDarkUrl,
		light: discordLightUrl,
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
		<Stack
			flex={1}
			w="100%"
			maw={900}
			mx="auto"
		>
			<PrimaryTitle>Looking for help?</PrimaryTitle>
			<Text
				mb="xl"
				fz="lg"
			>
				Running into issues with your cloud account, billing, or instances? We're here to
				help! Reach out to us through one of the following community support channels for
				help, or to get in touch with our team.
			</Text>
			<SupportTile
				image={discordUrl}
				title="Discord Chat"
				onClick={() => adapter.openUrl("https://discord.gg/dc4JNWrrMc")}
			/>
			<SupportTile
				image={documentationUrl}
				title="Cloud Documentation"
				onClick={() => adapter.openUrl("https://surrealdb.com/docs/cloud")}
			/>
			<SupportTile
				image={communtyUrl}
				title="Community Forums"
				onClick={() => adapter.openUrl("https://surrealdb.com/community/forums")}
			/>
		</Stack>
	);
}
