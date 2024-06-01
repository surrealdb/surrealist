import { Dispatch, SetStateAction, useState } from "react";
import { useStable } from "./stable";

export function useToggleList<T = string>(initial?: T[]): [T[], (item: T) => boolean, Dispatch<SetStateAction<T[]>>] {
	const [list, setList] = useState<T[]>(initial ?? []);

	const toggle = useStable((item: T) => {
		const index = list.indexOf(item);

		if (index === -1) {
			setList((list) => [...list, item]);
		} else {
			setList((list) => list.filter((i) => i !== item));
		}

		return index === -1;
	});

	return [list, toggle, setList];
}