import { Text } from "@mantine/core";
import { PropsWithChildren } from "react";
import { useIsLight } from "~/hooks/theme";

export function ModalTitle(props: PropsWithChildren) {
	const isLight = useIsLight();

	return (
		<Text fw={700} fz={16} c={isLight ? "light.6" : "white"}>
			{props.children}
		</Text>
	);
}