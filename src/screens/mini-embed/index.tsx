import { Box } from "@mantine/core";
import { adapter } from "~/adapter";
import type { MiniAdapter } from "~/adapter/mini";
import { Scaffold } from "~/components/Scaffold";
import { useIsLight } from "~/hooks/theme";
import { CommandsProvider } from "~/providers/Commands";
import MiniQueryView from "../surrealist/views/query/MiniView";

export function MiniRunScreen() {
	const { appearance, transparent } = adapter as MiniAdapter;
	const isLight = useIsLight();

	return (
		<Scaffold>
			<Box
				h="100vh"
				p={appearance === "plain" ? 0 : "md"}
				style={{
					backgroundColor: transparent
						? undefined
						: `var(--mantine-color-slate-${isLight ? 0 : 9})`,
				}}
			>
				<CommandsProvider>
					<MiniQueryView />
				</CommandsProvider>
			</Box>
		</Scaffold>
	);
}
