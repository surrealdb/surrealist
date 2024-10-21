import classes from "../style.module.scss";

import { Button, Stack, Text } from "@mantine/core";
import { useMemo } from "react";
import { Icon } from "~/components/Icon";
import { LearnMore } from "~/components/LearnMore";
import { useVersionCopy } from "~/hooks/debug";
import { isDevelopment, isPreview } from "~/util/environment";
import { iconCheck, iconWrench } from "~/util/icons";

export function AboutTab() {
	const [copyDebug, clipboard] = useVersionCopy();

	const versionText = useMemo(() => {
		let builder = import.meta.env.VERSION;

		if (isPreview) {
			builder += " (pre)";
		} else if (isDevelopment) {
			builder += " (dev)";
		}

		return builder;
	}, []);

	const information = useMemo(
		() => [
			["Version", versionText],
			["Build date", import.meta.env.DATE],
			["Build mode", import.meta.env.MODE],
			["Compatibility", import.meta.env.SDB_VERSION],
		],
		[versionText],
	);

	return (
		<>
			<Text c="slate">Surrealist &copy; 2024 SurrealDB Ltd</Text>
			<Stack
				gap="xs"
				mt="xl"
			>
				{information.map(([label, value]) => (
					<Text key="key">
						{label}:{" "}
						<Text
							className={classes.aboutValue}
							c="bright"
							span
						>
							{value}
						</Text>
					</Text>
				))}
			</Stack>
			<Stack mt="xl">
				<LearnMore href="https://github.com/surrealdb/surrealist/">
					GitHub Repository
				</LearnMore>
				<LearnMore href="https://surrealdb.com/docs/surrealist">
					Surrealist Documentation
				</LearnMore>
			</Stack>
			<Stack
				mt="xl"
				maw={250}
			>
				<Button
					onClick={copyDebug}
					rightSection={<Icon path={clipboard.copied ? iconCheck : iconWrench} />}
					color={clipboard.copied ? "surreal" : "slate"}
					variant="light"
					size="xs"
				>
					Copy environment information
				</Button>
			</Stack>
		</>
	);
}
