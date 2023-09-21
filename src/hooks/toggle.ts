import { useState } from "react";
import { useStable } from "./stable";

export type ToggleList = string[];
export type Toggler = (item: string) => boolean;

export function useToggleList(): [ToggleList, Toggler] {
	const [list, setList] = useState<ToggleList>([]);

	const toggle = useStable((item: string) => {
		const index = list.indexOf(item);

		if (index === -1) {
			setList((list) => [...list, item]);
		} else {
			setList((list) => list.filter((i) => i !== item));
		}

		return index === -1;
	});

	return [list, toggle];
}