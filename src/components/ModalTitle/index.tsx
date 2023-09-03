import { Text } from "@mantine/core";
import { PropsWithChildren } from "react";
import { useIsLight } from "~/hooks/theme";

export function ModalTitle(props: PropsWithChildren) {
	const isLight = useIsLight();

	return (
		<Text weight={700} size={16} color={isLight ? "light.6" : "white"}>
			{props.children}
		</Text>
	);
}