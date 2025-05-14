import { Alert, Box, Button, Group } from "@mantine/core";
import { useHasOrganizationRole } from "~/cloud/hooks/role";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { CloudInstance } from "~/types";
import { openSurrealChangelog } from "~/util/cloud";
import { iconOpen, iconReset } from "~/util/icons";

export interface UpdateBlockProps {
	instance: CloudInstance;
	isLoading: boolean;
	onUpdate: (version: string) => void;
	onVersions: () => void;
}

export function UpdateBlock({ instance, isLoading, onUpdate, onVersions }: UpdateBlockProps) {
	const latest = instance.available_versions[0] ?? "";
	const canUpdate = useHasOrganizationRole(instance.organization_id, "admin");
	const visible = latest && instance.state === "ready" && !isLoading && canUpdate;

	const handleUpdate = useStable(() => {
		onUpdate(latest);
	});

	return (
		visible && (
			<Alert
				color="violet"
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
					<Button
						size="xs"
						color="slate"
						variant="light"
						onClick={onVersions}
					>
						View all versions
					</Button>
				</Group>
			</Alert>
		)
	);
}
