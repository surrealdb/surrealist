import { useConfirmation } from "~/providers/Confirmation";
import { showErrorWithInfo } from "~/util/helpers";

/**
 * Confirm the update of an instance.
 */
export function useUpdateConfirmation<T>(callback: (value: T) => unknown) {
	return useConfirmation<T>({
		title: "Apply update?",
		message:
			"Your instance will experience temporary downtime during the update process. Do you wish to continue?",
		dismissText: "Cancel",
		confirmProps: {
			variant: "gradient",
		},
		onConfirm: async (value) => {
			try {
				await callback(value);
			} catch (err: any) {
				showErrorWithInfo({
					title: "Instance update failed",
					message: err.message ?? "An unknown error has occurred",
					cause: err.cause,
					trace: err.stack,
				});
			}
		},
	});
}
