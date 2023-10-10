import { Button } from "@mantine/core";
import { PropsWithChildren } from "react";
import { useIsLight } from "~/hooks/theme";
import { store, useStoreValue } from "~/store";
import { useStable } from "~/hooks/stable";
import { updateTitle } from "~/util/helpers";
import { SurrealistSession } from "~/types";
import { setActiveSession } from "~/stores/config";

export interface ViewTabProps {
	sessionInfo: SurrealistSession;
}

export function ViewTab({ sessionInfo }: PropsWithChildren<ViewTabProps>) {
	const isLight = useIsLight();
	const isActive = useStoreValue((state) => state.config.activeTab) === sessionInfo.id;

	const bgColor = isActive ? "surreal" : isLight ? "light.0" : "dark.4";
	const fgColor = isActive ? "white" : isLight ? "light.9" : "light.2";

	const select = useStable(() => {
		store.dispatch(setActiveSession(sessionInfo.id));

		updateTitle();
	});

	return (
		<Button px="md" pt={1} c={fgColor} color={bgColor} variant={isActive ? "filled" : "subtle"} onClick={select}>
			{sessionInfo?.name}
		</Button>
	);
}
