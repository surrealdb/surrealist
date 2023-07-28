import { Button } from "@mantine/core";
import { PropsWithChildren } from "react";
import { useIsLight } from "~/hooks/theme";
import { actions, store, useStoreValue } from "~/store";
import { useStable } from "~/hooks/stable";
import { updateTitle, updateConfig } from "~/util/helpers";
import { SurrealistTab } from "~/types";
import { VIEW_MODES } from "~/constants";
import { Icon } from "../Icon";

export interface ViewTabProps {
	tabInfo: SurrealistTab;
}

export function ViewTab({ tabInfo }: PropsWithChildren<ViewTabProps>) {
	const isLight = useIsLight();
	const isActive = useStoreValue(state => state.config.activeTab) === tabInfo.id;

	const bgColor = isActive ? 'surreal' : (isLight ? 'light.0' : 'dark.4');
	const fgColor = isActive ? 'white' : (isLight ? 'light.9' : 'light.2');

	const select = useStable(() => {
		store.dispatch(actions.setActiveTab(tabInfo.id));

		updateTitle();
		updateConfig();
	});

	return (
		<Button
			px="md"
			pt={1}
			c={fgColor}
			color={bgColor}
			variant={isActive ? 'filled' : 'subtle'}
			onClick={select}
		>
			<Icon
				path={VIEW_MODES.find(v => v.id === tabInfo?.activeView)!.icon}
				size={0.9}
				left
			/>
			{tabInfo?.name}
		</Button>
	);
}