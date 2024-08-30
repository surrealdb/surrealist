import { Box } from "@mantine/core";
import { useIsLight } from "~/hooks/theme";
import QueryView from "~/screens/database/views/query/QueryView";
import { adapter } from "~/adapter";
import { MiniAdapter } from "~/adapter/mini";
import { Scaffold } from "~/components/Scaffold";

export function MiniRunScreen() {
	const { hideBorder, transparent } = (adapter as MiniAdapter);

	const isLight = useIsLight();

	return (
		<Scaffold>
			<Box
				h="100vh"
				p={hideBorder ? 0 : "md"}
				style={{
					backgroundColor: transparent
						? undefined
						: `var(--mantine-color-slate-${isLight ? 0 : 9})`
				}}
			>
				<QueryView />
			</Box>
		</Scaffold>
	);
}