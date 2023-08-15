import { useMantineTheme } from "@mantine/core";
import { useIsLight } from "~/hooks/theme";

export function useHandleStyle() {
	const isLight = useIsLight();
	const { colors } = useMantineTheme();

	return {
		backgroundColor: isLight ? colors.light[2] : colors.dark[0],
		borderColor: "transparent",
	};
}
