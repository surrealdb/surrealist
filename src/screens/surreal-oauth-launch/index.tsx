import {
	Anchor,
	Button,
	MantineProvider,
	Stack,
	Text,
	v8CssVariablesResolver,
} from "@mantine/core";
import { Icon, iconOpen, iconSurreal, Spinner } from "@surrealdb/ui";
import { useLayoutEffect, useMemo } from "react";
import { useThemePreference } from "~/hooks/theme";
import { SURREALIST_THEME } from "~/util/mantine";
import { SURREAL_OAUTH_DEEP_LINK_HOST } from "~/util/surreal-oauth";
import classes from "../auth-launch/style.module.scss";

const ALLOWED_CALLBACK_PARAMS = new Set([
	"code",
	"state",
	"error",
	"error_description",
	"error_uri",
	"iss",
]);

export function SurrealOAuthLaunchScreen() {
	const colorScheme = useThemePreference();

	const launchUrl = useMemo(() => {
		const incoming = new URLSearchParams(window.location.search);
		const safe = new URLSearchParams();

		for (const [key, value] of incoming) {
			if (ALLOWED_CALLBACK_PARAMS.has(key)) {
				safe.append(key, value);
			}
		}

		return `surrealist://${SURREAL_OAUTH_DEEP_LINK_HOST}?${safe.toString()}`;
	}, []);

	useLayoutEffect(() => {
		location.href = launchUrl;
	}, [launchUrl]);

	return (
		<MantineProvider
			cssVariablesResolver={v8CssVariablesResolver}
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
