import { Alert, Box, Button, Group } from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { CloudInstance } from "~/types";
import { openSurrealChangelog } from "~/util/cloud";
import { iconOpen, iconReset } from "~/util/icons";

export interface UpdateBlockProps {
	instance: CloudInstance | undefined;
	onUpdate: (version: string) => void;
}

export function UpdateBlock({ instance, onUpdate }: UpdateBlockProps) {
	const versions = instance?.available_versions ?? [];
	const latest = versions[0] ?? "";
	const visible = latest && instance?.state === "ready";

	const handleUpdate = useStable(() => {
		onUpdate(latest);
	});

	return (
		visible && (
			<Alert
				color="surreal"
				title="Update available"
				icon={<Icon path={iconReset} />}
			>
				<Box>Your instance can be updated to SurrealDB {latest}</Box>
				<Group mt="md">
					<Button
						size="xs"
						variant="gradient"
						onClick={handleUpdate}
					>
						Update instance
					</Button>
					<Button
						size="xs"
						color="slate"
						variant="light"
						rightSection={<Icon path={iconOpen} />}
						onClick={() => openSurrealChangelog(latest)}
					>
						View changelog
					</Button>
				</Group>
			</Alert>
		)
	);
}
