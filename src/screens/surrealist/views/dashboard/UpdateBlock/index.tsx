import { Alert, Box, Group, Button } from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { adapter } from "~/adapter";
import { fetchAPI } from "~/cloud/api";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { useConfirmation } from "~/providers/Confirmation";
import { CloudInstance } from "~/types";
import { iconOpen, iconReset } from "~/util/icons";

export interface UpdateBlockProps {
	instance: CloudInstance | undefined;
}

export function UpdateBlock({ instance }: UpdateBlockProps) {
	const client = useQueryClient();

	const versions = instance?.available_versions ?? [];
	const release = versions[0] ?? "";
	const visible = release && instance?.state === "ready";

	const handleChangelog = useStable(() => {
		adapter.openUrl(`https://surrealdb.com/releases#v${release.replaceAll(".", "-")}`);
	});

	const handleUpdate = useConfirmation({
		title: "Update instance",
		message: "Your instance will experience temporary downtime during the update process.",
		dismissText: "Cancel",
		confirmText: "Update",
		confirmProps: {
			variant: "gradient",
			rightSection: <Icon path={iconReset} />,
		},
		onConfirm: async () => {
			await fetchAPI(`/instances/${instance?.id}/version`, {
				method: "PATCH",
				body: JSON.stringify({ version: release }),
			});

			client.invalidateQueries({
				queryKey: ["cloud", "instances"],
			});
		},
	});

	return (
		visible && (
			<Alert
				color="surreal"
				title="Update available"
				icon={<Icon path={iconReset} />}
			>
				<Box>Your instance can be updated to version {release}</Box>
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
						onClick={handleChangelog}
					>
						View changelog
					</Button>
				</Group>
			</Alert>
		)
	);
}
