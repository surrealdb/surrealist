import { useConfirmation } from "~/providers/Confirmation";
import { showErrorNotification } from "~/util/helpers";

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
		skippable: true,
		onConfirm: async (value) => {
			try {
				await callback(value);
			} catch (err: any) {
				showErrorNotification({
					title: "Instance update failed",
					content: err,
				});
			}
		},
	});
}
