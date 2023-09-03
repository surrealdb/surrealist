import { useMantineTheme } from "@mantine/core";
import { useIsLight } from "~/hooks/theme";
import { useStoreValue } from "~/store";
import { DesignerLayoutMode, DesignerNodeMode, SurrealistTab } from "~/types";

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
	activeTab: SurrealistTab | undefined
): DesignerConfig {
	const defaultNodeMode = useStoreValue(s => s.config.defaultDesignerNodeMode);
	const defaultLayoutMode = useStoreValue(s => s.config.defaultDesignerLayoutMode);

	const nodeMode = activeTab?.designerNodeMode ?? defaultNodeMode;
	const layoutMode = activeTab?.designerLayoutMode ?? defaultLayoutMode;

	return {
		nodeMode,
		layoutMode,
	};
}