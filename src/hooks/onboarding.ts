import { useConfigStore } from "~/stores/config";
import { useStable } from "./stable";

/**
 * Returns whether the onboarding step has been completed
 *
 * @returns A tuple containing a boolean indicating whether the onboarding step has been completed and a function to mark the onboarding step as completed
 */
export function useOnboarding(onboarding: string) {
	const { completeOnboarding } = useConfigStore.getState();

	const complete = useStable(() => {
		completeOnboarding(onboarding);
	});

	return [useConfigStore((s) => s.onboarding.includes(onboarding)), complete] as const;
}

/**
 * Returns whether the onboarding step has been completed
 *
 * @param onboarding The onboarding step to check
 * @returns A boolean indicating whether the onboarding step has been completed
 */
export function hasCompletedOnboarding(onboarding: string) {
	return useConfigStore.getState().onboarding.includes(onboarding);
}
