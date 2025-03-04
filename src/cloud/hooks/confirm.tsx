import { useConfirmation } from "~/providers/Confirmation";

/**
 * Confirm the update of an instance.
 */
export function useUpdateConfirmation<T>(callback: (value: T) => void) {
	return useConfirmation<T>({
		title: "Apply update?",
		message:
			"Your instance will experience temporary downtime during the update process. Do you wish to continue?",
		dismissText: "Cancel",
		confirmProps: {
			variant: "gradient",
		},
		onConfirm: callback,
	});
}
