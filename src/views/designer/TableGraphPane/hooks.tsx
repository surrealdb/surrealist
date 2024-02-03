import { useMantineTheme } from "@mantine/core";
import { useIsLight } from "~/hooks/theme";
import { useConfigStore } from "~/stores/config";
import { DesignerLayoutMode, DesignerNodeMode, SurrealistSession } from "~/types";

interface DesignerConfig {
	nodeMode: DesignerNodeMode;
	layoutMode: DesignerLayoutMode;
}

export function useHandleStyle() {
	const isLight = useIsLight();
	const { colors } = useMantineTheme();

	return {
		backgroundColor: isLight ? colors.light[2] : colors.dark[0],
		borderColor: "transparent",
	};
}

export function useDesignerConfig(
	activeSession: SurrealistSession | undefined
): DesignerConfig {
	const defaultNodeMode = useConfigStore((s) => s.defaultDesignerNodeMode);
	const defaultLayoutMode = useConfigStore((s) => s.defaultDesignerLayoutMode);

	const nodeMode = activeSession?.designerNodeMode ?? defaultNodeMode;
	const layoutMode = activeSession?.designerLayoutMode ?? defaultLayoutMode;

	return {
		nodeMode,
		layoutMode,
	};
}