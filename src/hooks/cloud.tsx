import { Alert, Stack, Text } from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "~/cloud/api";
import { useConfirmation } from "~/providers/Confirmation";
import { useCloudStore } from "~/stores/cloud";
import { useConfigStore } from "~/stores/config";
import { CloudInstance, Connection } from "~/types";
import { tagEvent } from "~/util/analytics";
import { useFeatureFlags } from "~/util/feature-flags";
import { showErrorNotification, showInfo } from "~/util/helpers";

/**
 * Returns whether cloud functionality is enabled
 */
export function useIsCloudEnabled() {
	return useFeatureFlags()[0].cloud_enabled;
}

/**
 * Returns whether the user is authenticated to Surreal Cloud
 */
export function useIsAuthenticated() {
	return useCloudStore((s) => s.authState === "authenticated");
}

/**
 * Returns the current user profile
 */
export function useCloudProfile() {
	return useCloudStore((s) => s.profile);
}

/**
 * Returns whether the user has a specific cloud feature flag enabled
 */
export function useHasCloudFeature(feature: string) {
	const { enabled_features } = useCloudProfile();

	return enabled_features?.includes(feature) ?? false;
}

/**
 * Lists out the available instance versions
 */
export function useAvailableInstanceVersions() {
	return useCloudStore((s) => s.instanceVersions);
}

/**
 * Prompt the pausing of a cloud instance
 */
export function usePauseInstance(instance: CloudInstance): () => void {
	const client = useQueryClient();

	return useConfirmation({
		title: `Pause ${instance.name}`,
		message:
			"You can pause this instance to temporarily stop all resources and save costs, while data contained in this instance will be preserved.",
		skippable: true,
		confirmText: "Pause",
		confirmProps: {
			variant: "gradient",
		},
		onConfirm: async () => {
			try {
				await fetchAPI(`/instances/${instance.id}/pause`, {
					method: "POST",
				});

				client.invalidateQueries({
					queryKey: ["cloud", "instances"],
				});

				tagEvent("cloud_instance_paused", {
					instance: instance.id,
					region: instance.region,
					version: instance.version,
					instance_type: instance.type.slug,
					storage_size: instance.storage_size,
					organisation: instance.organization_id,
				});
			} catch (err: any) {
				showErrorNotification({
					title: "Failed to pause instance",
					content: err,
				});
			}
		},
	});
}

/**
 * Prompt the resuming of a cloud instance
 */
export function useResumeInstance(instance: CloudInstance): () => void {
	const client = useQueryClient();

	return useConfirmation({
		title: `Resume ${instance.name}`,
		message: "Resume your instance to restore all resources and allow access to your data",
		skippable: true,
		confirmText: "Resume",
		confirmProps: {
			variant: "gradient",
		},
		onConfirm: async () => {
			try {
				await fetchAPI(`/instances/${instance.id}/resume`, {
					method: "POST",
				});

				client.invalidateQueries({
					queryKey: ["cloud", "instances"],
				});

				tagEvent("cloud_instance_resumed", {
					instance: instance.id,
					region: instance.region,
					version: instance.version,
					instance_type: instance.type.slug,
					storage_size: instance.storage_size,
					organisation: instance.organization_id,
				});
			} catch (err: any) {
				showErrorNotification({
					title: "Failed to resume instance",
					content: err,
				});
			}
		},
	});
}

/**
 * Prompt the deletion of a cloud instance
 */
export function useDeleteInstance(instance: CloudInstance, connection?: Connection): () => void {
	const { removeConnection } = useConfigStore.getState();

	const client = useQueryClient();

	return useConfirmation({
		message: (
			<Stack>
				<Text>
					You are about to delete this instance. This will cause all associated resources
					to be destroyed.
				</Text>
				<Alert
					title="Important"
					color="red"
				>
					Data stored within this instance will be permanently deleted and cannot be
					recovered.
				</Alert>
			</Stack>
		),
		confirmText: "Delete",
		title: `Delete ${instance.name}`,
		verification: instance.name,
		verifyText: "Type the instance name to confirm",
		onConfirm: async () => {
			try {
				await fetchAPI(`/instances/${instance.id}`, {
					method: "DELETE",
				});

				if (connection) {
					removeConnection(connection.id);
				}

				showInfo({
					title: "Deleting instance",
					subtitle: (
						<>
							<Text
								span
								c="bright"
							>
								{instance.name}
							</Text>{" "}
							is being deleted
						</>
					),
				});

				client.invalidateQueries({
					queryKey: ["cloud", "instances"],
				});

				tagEvent("cloud_instance_deleted", {
					instance: instance.id,
					region: instance.region,
					version: instance.version,
					instance_type: instance.type.slug,
					storage_size: instance.storage_size,
					organisation: instance.organization_id,
				});
			} catch (err: any) {
				showErrorNotification({
					title: "Failed to delete instance",
					content: err,
				});
			}
		},
	});
}
