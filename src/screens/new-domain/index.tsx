import { Image } from "@mantine/core";
import { Alert, Box, Button, Divider, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import { adapter } from "~/adapter";
import { Icon } from "~/components/Icon";
import { Link } from "~/components/Link";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Scaffold } from "~/components/Scaffold";
import { TopGlow } from "~/components/TopGlow";
import { JSON_FILTER } from "~/constants";
import { useStable } from "~/hooks/stable";
import { useIsLight, useThemeImage } from "~/hooks/theme";
import { backupConfig } from "~/util/config";
import { iconArrowUpRight, iconDownload } from "~/util/icons";

import logoDarkUrl from "~/assets/images/dark/logo.webp";
import iconUrl from "~/assets/images/icon.webp";
import logoLightUrl from "~/assets/images/light/logo.webp";
import { useState } from "react";

export function NewDomainScreen() {
	const isLight = useIsLight();
	const [targetLink, setTargetLink] = useState("https://app.surrealdb.com");

	const saveBackup = useStable(() => {
		setTargetLink("https://app.surrealdb.com?intent=open-settings:tab=manage-data");
		adapter.saveFile(
			"Save config backup",
			"surrealist-backup.json",
			[JSON_FILTER],
			async () => {
				return backupConfig({
					stripSensitive: false,
					connections: [],
				});
			},
		);
	});

	const logoUrl = useThemeImage({
		light: logoLightUrl,
		dark: logoDarkUrl,
	});

	return (
		<Scaffold>
			<Box
				h="100vh"
				bg={`var(--mantine-color-slate-${isLight ? 0 : 9})`}
			>
				<TopGlow />
				<Box
					pt={68}
					pos="relative"
				>
					<Stack
						align="center"
						gap={0}
					>
						<Image
							src={iconUrl}
							w={85}
						/>

						<Image
							src={logoUrl}
							w={225}
							mt="md"
						/>
					</Stack>
					<Paper
						p="xl"
						mt={38}
						maw={500}
						mx="auto"
						variant="gradient"
					>
						<Stack gap="xl">
							<PrimaryTitle fz={32}>Surrealist has moved!</PrimaryTitle>
							<Text fz="lg">
								We've moved to{" "}
								<Link
									inherit
									href="https://app.surrealdb.com"
								>
									app.surrealdb.com
								</Link>{" "}
								as part of our ongoing efforts to improve Surrealist and consolidate
								our products into a single, unified platform.
							</Text>
							<Divider />
							<Alert
								color="orange"
								title="Export your web configuration"
							>
								You can export your current web app configuration and import it into
								app.surrealdb.com to keep your existing connections, queries, and
								other settings.
							</Alert>
							<SimpleGrid cols={2}>
								<Button
									rightSection={<Icon path={iconDownload} />}
									variant="light"
									color="slate"
									onClick={saveBackup}
								>
									Export config
								</Button>
								<a href={targetLink}>
									<Button
										rightSection={<Icon path={iconArrowUpRight} />}
										variant="gradient"
										fullWidth
										flex={1}
									>
										Go to app.surrealdb.com
									</Button>
								</a>
							</SimpleGrid>
						</Stack>
					</Paper>
				</Box>
			</Box>
		</Scaffold>
	);
}
