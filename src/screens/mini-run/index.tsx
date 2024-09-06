import { Box } from "@mantine/core";
import { adapter } from "~/adapter";
import type { MiniAdapter } from "~/adapter/mini";
import { Scaffold } from "~/components/Scaffold";
import { useIsLight } from "~/hooks/theme";
import QueryView from "~/screens/database/views/query/QueryView";

export function MiniRunScreen() {
	const { hideBorder, transparent } = adapter as MiniAdapter;

	const isLight = useIsLight();

	return (
		<Scaffold>
			<Box
				h="100vh"
				p={hideBorder ? 0 : "md"}
				style={{
					backgroundColor: transparent
						? undefined
						: `var(--mantine-color-slate-${isLight ? 0 : 9})`,
				}}
			>
				<QueryView />
			</Box>
		</Scaffold>
	);
}
