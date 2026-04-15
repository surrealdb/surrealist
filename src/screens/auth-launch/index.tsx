import { Anchor, Button, MantineProvider, Stack, Text } from "@mantine/core";
import { Icon, iconOpen, iconSurreal, Spinner } from "@surrealdb/ui";
import { useLayoutEffect, useMemo } from "react";
import { useThemePreference } from "~/hooks/theme";
import { SURREALIST_THEME } from "~/util/mantine";
import classes from "./style.module.scss";

export function AuthLaunchScreen() {
	const colorScheme = useThemePreference();

	const launchUrl = useMemo(() => {
		const params = new URLSearchParams(window.location.search);
		return `surrealist://callback/auth?${params.toString()}`;
	}, []);

	useLayoutEffect(() => {
		location.href = launchUrl;
	}, [launchUrl]);

	return (
		<MantineProvider
			withCssVariables
			theme={SURREALIST_THEME}
			forceColorScheme={colorScheme}
		>
			<Stack
				className={classes.root}
				justify="center"
				align="center"
				gap={0}
			>
				<Icon
					path={iconSurreal}
					size={72}
					c="bright"
				/>
				<Text
					fz={22}
					fw={600}
					mt="xl"
				>
					Opening Surrealist...
				</Text>
				<Text
					fz="md"
					c="slate"
					mt="xs"
				>
					You can close this page once the app has opened
				</Text>
				<Spinner
					mt={28}
					size="sm"
					color="surreal"
				/>
				<Anchor
					href={launchUrl}
					mt={42}
					underline="always"
					c="slate"
					fz="sm"
				>
					<Button
						variant="light"
						leftSection={<Icon path={iconOpen} />}
					>
						Open manually
					</Button>
				</Anchor>
			</Stack>
		</MantineProvider>
	);
}
