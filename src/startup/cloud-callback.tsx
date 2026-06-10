import "@mantine/core/styles.layer.css";
import "@surrealdb/ui/styles.css";

import "../assets/styles/override.scss";
import "../assets/styles/variants.scss";
import "../assets/styles/global.scss";

import {
	Anchor,
	Button,
	Image,
	MantineProvider,
	Stack,
	Text,
	v8CssVariablesResolver,
} from "@mantine/core";
import { pictoDownload } from "@surrealdb/ui";
import { createRoot } from "react-dom/client";
import { useThemePreference } from "~/hooks/theme";
import authReturnClasses from "~/screens/auth-return/style.module.scss";
import { SURREALIST_THEME } from "~/util/mantine";

const DOWNLOAD_URL = "https://surrealdb.com/surrealist?download=true";

function AuthCallbackScreen() {
	const colorScheme = useThemePreference();

	return (
		<MantineProvider
			cssVariablesResolver={v8CssVariablesResolver}
			theme={SURREALIST_THEME}
			forceColorScheme={colorScheme}
		>
			<Stack
				className={authReturnClasses.root}
				justify="center"
				align="center"
				gap="xl"
				p="xl"
			>
				<Image
					src={pictoDownload}
					alt="Download Surrealist"
					w={100}
				/>
				<Text
					fz="lg"
					ta="center"
					maw={480}
				>
					You must update Surrealist to use this sign-in flow. Install the latest version
					from the website.
				</Text>
				<Anchor
					href={DOWNLOAD_URL}
					target="_blank"
					rel="noopener noreferrer"
					underline="never"
				>
					<Button size="md">Download Surrealist</Button>
				</Anchor>
			</Stack>
		</MantineProvider>
	);
}

(async () => {
	const root = document.querySelector("#root");

	if (!root) {
		throw new Error("Root element not found");
	}

	createRoot(root).render(<AuthCallbackScreen />);
})();
