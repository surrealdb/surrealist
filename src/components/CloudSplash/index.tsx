import { Button, Center, Group, Image, Stack, Text } from "@mantine/core";
import { Icon, iconChevronRight, iconOpen, pictoSDBCloudGradient } from "@surrealdb/ui";
import { adapter } from "~/adapter";
import logoDarkImg from "~/assets/images/dark/cloud-logo.svg";
import logoLightImg from "~/assets/images/light/cloud-logo.svg";
import { useThemeImage } from "~/hooks/theme";
import { useAuthentication } from "~/providers/Auth";

export function CloudSplash() {
	const { signIn, isLoading: isAuthLoading } = useAuthentication();

	const logoImg = useThemeImage({
		light: logoLightImg,
		dark: logoDarkImg,
	});

	return (
		<Center
			h="90%"
			pos="relative"
		>
			<Stack align="center">
				<Image
					src={pictoSDBCloudGradient}
					alt=""
					maw={125}
				/>
				<Image
					src={logoImg}
					alt="SurrealDB Cloud"
					maw={450}
					my="xl"
				/>
				<Text
					fz="xl"
					w="100%"
					maw={520}
					ta="center"
				>
					SurrealDB Cloud redefines the database experience, offering the power and
					flexibility of SurrealDB without the pain of managing infrastructure.
				</Text>
				<Group
					mt={42}
					w="100%"
					maw={450}
				>
					<Button
						flex={1}
						variant="gradient"
						onClick={() => signIn()}
						rightSection={<Icon path={iconChevronRight} />}
						loading={isAuthLoading}
					>
						Sign in
					</Button>
					<Button
						flex={1}
						color="obsidian"
						variant="light"
						rightSection={<Icon path={iconOpen} />}
						onClick={() => adapter.openUrl("https://surrealdb.com/cloud")}
					>
						Learn more
					</Button>
				</Group>
			</Stack>
		</Center>
	);
}
