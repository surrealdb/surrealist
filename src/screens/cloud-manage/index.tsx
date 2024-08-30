import { Stack } from "@mantine/core";
import {useIsLight } from "~/hooks/theme";
import { CloudView } from "./view";
import { Scaffold } from "~/components/Scaffold";

export function CloudManageScreen() {
	const isLight = useIsLight();

	return (
		<Scaffold>
			<Stack
				h="100vh"
				p="md"
				style={{
					backgroundColor: `var(--mantine-color-slate-${isLight ? 0 : 9})`
				}}
			>
				<CloudView />
			</Stack>
		</Scaffold>
	);
}