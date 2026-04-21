// import type { Event } from "@tauri-apps/api/event";
// import { getCurrentWindow } from "@tauri-apps/api/window";
// import { useEffect } from "react";
// import { adapter } from "~/adapter";
// import { useCloud } from "~/providers/Cloud";
// import { type CloudSyncPayload, useCloudStore } from "~/stores/cloud";
// import {
// 	buildCloudSyncPayload,
// 	emitCloudSyncPayload,
// 	isCloudSyncSuppressed,
// 	suppressCloudSync,
// } from "~/util/cloud";

// /**
//  * Desktop: broadcast local cloud state to other windows and apply remote `cloud-updated`
//  * payloads back into the CloudProvider + cloud store. No-op on non-desktop adapters.
//  */
// export function useCloudWindowSync() {
// 	const {
// 		error,
// 		isActive,
// 		isLoading,
// 		sessionToken,
// 		userId,
// 		authProvider,
// 		profile,
// 		sessionExpired,
// 		setError,
// 		setIsActive,
// 		setIsLoading,
// 		setSessionToken,
// 		setUserId,
// 		setAuthProvider,
// 		setProfile,
// 		setSessionExpired,
// 	} = useCloud();

// 	useEffect(() => {
// 		if (adapter.id !== "desktop") {
// 			return;
// 		}

// 		const unlisten = getCurrentWindow().listen(
// 			"cloud-updated",
// 			(event: Event<CloudSyncPayload>) => {
// 				const payload = event.payload;

// 				suppressCloudSync(() => {
// 					setError(payload.authError);
// 					setIsActive(payload.cloudSessionActive);
// 					setIsLoading(payload.isProcessingAuth);
// 					setSessionToken(payload.sessionToken);
// 					setUserId(payload.userId);
// 					setAuthProvider(payload.authProvider);
// 					setProfile(payload.profile);
// 					setSessionExpired(payload.sessionExpired);

// 					useCloudStore.setState({
// 						isSupported: payload.isSupported,
// 						failedConnect: payload.failedConnect,
// 						instanceVersions: payload.instanceVersions,
// 						instanceTypes: payload.instanceTypes,
// 						instanceRegions: payload.instanceRegions,
// 						contextRegions: payload.contextRegions,
// 						billingCountries: payload.billingCountries,
// 						onboardingRequired: payload.onboardingRequired,
// 						isProvisioning: payload.isProvisioning,
// 						isProvisionDone: payload.isProvisionDone,
// 						provisioning: payload.provisioning,
// 						chatConversation: payload.chatConversation,
// 						chatLastResponse: payload.chatLastResponse,
// 					});
// 				});
// 			},
// 		);

// 		return () => {
// 			void unlisten.then((fn) => fn());
// 		};
// 	}, [
// 		setError,
// 		setIsActive,
// 		setIsLoading,
// 		setSessionToken,
// 		setUserId,
// 		setAuthProvider,
// 		setProfile,
// 		setSessionExpired,
// 	]);

// 	useEffect(() => {
// 		if (adapter.id !== "desktop") {
// 			return;
// 		}

// 		let scheduled = false;

// 		const scheduleEmit = () => {
// 			if (isCloudSyncSuppressed() || scheduled) {
// 				return;
// 			}

// 			scheduled = true;

// 			queueMicrotask(() => {
// 				scheduled = false;
// 				const r = useCloudStore.getState();
// 				const payload = buildCloudSyncPayload(r, {
// 					error,
// 					isActive,
// 					isLoading,
// 					sessionToken,
// 					userId,
// 					authProvider,
// 					profile,
// 					sessionExpired,
// 				});
// 				void emitCloudSyncPayload(payload);
// 			});
// 		};

// 		const unsub = useCloudStore.subscribe(scheduleEmit);
// 		scheduleEmit();

// 		return unsub;
// 	}, [error, isActive, isLoading, sessionToken, userId, authProvider, profile, sessionExpired]);
// }
