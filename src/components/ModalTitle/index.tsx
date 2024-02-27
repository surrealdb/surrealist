import { Text } from "@mantine/core";
import { PropsWithChildren } from "react";

export function ModalTitle(props: PropsWithChildren) {
	return (
		<Text fw={700} fz={20} c="bright">
			{props.children}
		</Text>
	);
}