import {
	checkSessionExpiry,
	invalidateSession,
	openCloudAuthentication,
	refreshAccess,
	verifyAuthentication,
} from "~/cloud/api/auth";

import { Alert, Stack, Text } from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { useLayoutEffect } from "react";
import { adapter } from "~/adapter";
import { fetchAPI } from "~/cloud/api";
import { useConfirmation } from "~/providers/Confirmation";
import { useCloudStore } from "~/stores/cloud";
import { useConfigStore } from "~/stores/config";
import { CloudInstance, Connection } from "~/types";
import { tagEvent } from "~/util/analytics";
import { featureFlags, useFeatureFlags } from "~/util/feature-flags";
import { showErrorNotification, showInfo } from "~/util/helpers";
import { CODE_RES_KEY, STATE_RES_KEY } from "~/util/storage";
import { useIntent } from "./routing";

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
 * Returns the list of known organizations
 */
export function useOrganizations() {
	return useCloudStore((s) => s.organizations);
}

/**
 * Lists out the available instance versions
 */
export function useAvailableInstanceVersions() {
	return useCloudStore((s) => s.instanceVersions);
}

/**
 * Automatically set up the cloud authentication flow
 */
export function useCloudAuthentication() {
	useLayoutEffect(() => {
		const responseCode = sessionStorage.getItem(CODE_RES_KEY);
		const responseState = sessionStorage.getItem(STATE_RES_KEY);

		// Check for configured redirect response, otherwise
		// attempt to refresh the currently active session
		if (responseCode && responseState) {
			sessionStorage.removeItem(CODE_RES_KEY);
			sessionStorage.removeItem(STATE_RES_KEY);

			verifyAuthentication(responseCode, responseState);
		} else {
			refreshAccess();
		}

		// Automatically refresh the session before it expires
		setInterval(checkSessionExpiry, 1000 * 60 * 3);
	}, []);

	// React to authentication intents
	useIntent("cloud-auth", (payload) => {
		const { code, state } = payload;

		if (!code || !state) {
			adapter.warn("Cloud", "Invalid cloud callback payload");
			return;
		}

		verifyAuthentication(code, state);
	});

	// React to signin intents
	useIntent("cloud-signin", () => {
		openCloudAuthentication();
	});

	// React to callback intents
	useIntent("cloud-signout", () => {
		invalidateSession();
	});

	// React to cloud activation
	useIntent("cloud-activate", () => {
		featureFlags.set("cloud_access", true);
	});
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
					compute_type: instance.type.category,
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
					compute_type: instance.type.category,
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
					compute_type: instance.type.category,
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
