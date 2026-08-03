import { Box, type BoxProps, Button, Group, Image, Stack, Text, Title } from "@mantine/core";
import {
	Icon,
	iconArrowUpRight,
	iconCheck,
	iconDownload,
	pictoSurrealistGradient,
} from "@surrealdb/ui";
import { adapter } from "~/adapter";
import { JSON_FILTER, STUDIO_URL } from "~/constants";
import { useBoolean } from "~/hooks/boolean";
import { useStable } from "~/hooks/stable";
import { backupConfig } from "~/util/config";
import { showErrorNotification } from "~/util/helpers";
import classes from "./style.module.scss";

export interface StudioMigrationProps extends BoxProps {
	/** Renders a more compact variant, intended for use inside a modal */
	compact?: boolean;
}

/**
 * Informs the user that Surrealist has been succeeded by SurrealDB Studio, and
 * lets them take their configuration with them.
 *
 * Shared between the sunset web app screen and the desktop migration modal.
 */
export function StudioMigration({ compact, ...other }: StudioMigrationProps) {
	const [exported, exportedHandle] = useBoolean();

	const exportConfig = useStable(async () => {
		try {
			const saved = await adapter.saveFile(
				"Export Surrealist configuration",
				"surrealist-config.json",
				[JSON_FILTER],
				() => backupConfig({ stripSensitive: false, connections: [] }),
			);

			if (saved) {
				exportedHandle.open();
			}
		} catch (err: any) {
			showErrorNotification({
				title: "Export failed",
				content: err,
			});
		}
	});

	const openStudio = useStable(() => {
		adapter.openUrl(STUDIO_URL);
	});

	return (
		<Stack
			align="center"
			gap={0}
			maw={520}
			{...other}
		>
			<Image
				src={pictoSurrealistGradient}
				alt=""
				w={compact ? 56 : 72}
				h={compact ? 56 : 72}
			/>

			<Title
				order={2}
				mt="xl"
				ta="center"
				fz={compact ? 24 : 30}
			>
				Surrealist is now SurrealDB Studio
			</Title>

			<Text
				mt="md"
				ta="center"
				fz="lg"
				className="selectable"
			>
				Surrealist has moved to a new home. SurrealDB Studio is the successor, and is where
				all future development takes place. Export your configuration below to bring your
				connections and preferences along.
			</Text>

			<Text
				mt="xs"
				ta="center"
				fz="sm"
				className="selectable"
			>
				The exported JSON file includes your saved authentication credentials, so keep it
				somewhere safe.
			</Text>

			<Group
				mt={compact ? "xl" : 36}
				justify="center"
				className={classes.actions}
			>
				<Button
					color="obsidian"
					onClick={exportConfig}
					rightSection={<Icon path={exported ? iconCheck : iconDownload} />}
				>
					{exported ? "Configuration exported" : "Export configuration"}
				</Button>
				<Button
					variant="gradient"
					onClick={openStudio}
					rightSection={<Icon path={iconArrowUpRight} />}
				>
					Go to SurrealDB Studio
				</Button>
			</Group>

			<Box
				mt="xl"
				ta="center"
			>
				<Text
					fz="sm"
					className="selectable"
				>
					studio.surrealdb.com
				</Text>
			</Box>
		</Stack>
	);
}
