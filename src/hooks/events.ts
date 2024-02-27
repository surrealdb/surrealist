import { useStable } from "./stable";

/**
 * Extract the checked status from a checkbox input
 *
 * @param cb The callback to invoke with the checked status
 */
export function useCheckbox(cb: (checked: boolean) => void) {
	return useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		cb(e.target.checked);
	});
}