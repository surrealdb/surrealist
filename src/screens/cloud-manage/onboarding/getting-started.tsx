import logoDarkUrl from "~/assets/images/dark/cloud-logo.svg";
import logoLightUrl from "~/assets/images/light/cloud-logo.svg";
import { Anchor, Button, Group, Image, Paper, Stack, Text } from "@mantine/core";
import { openModal, closeAllModals } from "@mantine/modals";
import { Spacer } from "~/components/Spacer";
import { Icon } from "~/components/Icon";
import { iconBook, iconChat, iconChevronRight, iconOpen, iconVideo } from "~/util/icons";
import { useIsLight, useThemeImage } from "~/hooks/theme";

export function openStartingModal() {
	openModal({
		size: 525,
		children: (
			<StartingModal />
		)
	});
}

function StartingModal() {
	const isLight = useIsLight();

	const logoUrl = useThemeImage({
		light: logoLightUrl,
		dark: logoDarkUrl
	});

	return (
		<Stack gap="xl">
			<Image
				src={logoUrl}
				mx="auto"
				my={28}
				w={400}
			/>
			<Text fz="lg">
				Welcome to Surreal Cloud! We are excited to have you on board. Before you get started, feel free to explore our documentation to learn more about our features and capabilities.
			</Text>
			<Stack my="xl">
				<Anchor
					href="https://surrealdb.com/docs/cloud"
					underline="never"
				>
					<Paper
						px="md"
						py="xl"
						radius="md"
						bg={isLight ? "slate.0" : "slate.9"}
						withBorder
					>
						<Group>
							<Icon path={iconVideo} />
							<Text
								c="bright"
								fz="lg"
								fw={500}
							>
								Watch the introduction video
							</Text>
							<Spacer />
							<Icon path={iconOpen} c="surreal" />
						</Group>
					</Paper>
				</Anchor>
				<Anchor
					href="https://surrealdb.com/docs/cloud"
					underline="never"
				>
					<Paper
						px="md"
						py="xl"
						radius="md"
						bg={isLight ? "slate.0" : "slate.9"}
						withBorder
					>
						<Group>
							<Icon path={iconBook} />
							<Text
								c="bright"
								fz="lg"
								fw={500}
							>
								Visit Cloud documentation
							</Text>
							<Spacer />
							<Icon path={iconOpen} c="surreal" />
						</Group>
					</Paper>
				</Anchor>
				<Anchor
					href="https://surrealdb.com/docs/cloud"
					underline="never"
				>
					<Paper
						px="md"
						py="xl"
						radius="md"
						bg={isLight ? "slate.0" : "slate.9"}
						withBorder
					>
						<Group>
							<Icon path={iconChat} />
							<Text
								c="bright"
								fz="lg"
								fw={500}
							>
								Discuss with the community
							</Text>
							<Spacer />
							<Icon path={iconOpen} c="surreal" />
						</Group>
					</Paper>
				</Anchor>
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