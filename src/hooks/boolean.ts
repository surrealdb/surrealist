import { useState } from "react";
import { useStable } from "./stable";

export interface BooleanHandle {
	open: () => void;
	close: () => void;
	toggle: () => void;
	set: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useBoolean(
	initialState = false,
	callbacks?: { onOpen?: () => void; onClose?: () => void },
): readonly [boolean, BooleanHandle] {
	const { onOpen, onClose } = callbacks || {};
	const [opened, setOpened] = useState(initialState);

	const open = useStable(() => {
		setOpened((isOpened) => {
			if (!isOpened) {
				onOpen?.();
				return true;
			}
			return isOpened;
		});
	});

	const close = useStable(() => {
		setOpened((isOpened) => {
			if (isOpened) {
				onClose?.();
				return false;
			}
			return isOpened;
		});
	});

	const toggle = useStable(() => {
		opened ? close() : open();
	});

	const [handle] = useState({ open, close, toggle, set: setOpened });

	return [opened, handle];
}
