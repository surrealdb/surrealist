import { Alert, Box, Button, Group } from "@mantine/core";
import { Icon, iconOpen, iconReset } from "@surrealdb/ui";
import { hasOrganizationRoles, ORG_ROLES_ADMIN } from "~/cloud/helpers";
import { useStable } from "~/hooks/stable";
import { CloudInstance, CloudOrganization } from "~/types";
import { openSurrealChangelog } from "~/util/cloud";

export interface UpdateBlockProps {
	instance: CloudInstance;
	organisation: CloudOrganization;
	isLoading: boolean;
	onUpdate: (version: string) => void;
	onVersions: () => void;
}

export function UpdateBlock({
	instance,
	organisation,
	isLoading,
	onUpdate,
	onVersions,
}: UpdateBlockProps) {
	const latest = instance.available_versions[0] ?? "";
	const canUpdate = hasOrganizationRoles(organisation, ORG_ROLES_ADMIN);
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
				mb={6}
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
						color="obsidian"
						variant="light"
						rightSection={<Icon path={iconOpen} />}
						onClick={() => openSurrealChangelog(latest)}
					>
						View changelog
					</Button>
					<Button
						size="xs"
						color="obsidian"
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
