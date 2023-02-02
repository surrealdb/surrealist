import {useEffect} from "react";
import {debounce} from "radash";

/**
 *
 * @param value
 * @param onDebounce
 * @param delay in milliseconds
 */
export default function useDebouncedCallback<T>(value: T, onDebounce: (state: T) => void, delay: number) {
	useEffect(() => {
		const debounced = debounce({ delay }, onDebounce);

		debounced(value);
	}, [delay, value]);
}
