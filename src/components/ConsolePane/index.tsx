import { useEffect, useRef, useMemo } from "react";
import { Panel } from "~/components/Panel";
import { mdiClose, mdiConsole, mdiDelete } from "@mdi/js";
import { ActionIcon, Center, Group, ScrollArea, Text, useMantineTheme } from "@mantine/core";
import { Icon } from "~/components/Icon";
import AnsiToHtml from "ansi-to-html";
import { useStable } from "~/hooks/stable";
import { useDatabaseStore } from "~/stores/database";
import { useConfigStore } from "~/stores/config";

function ConsoleActions() {
	const clearConsole = useDatabaseStore((s) => s.clearConsole);
	const setConsoleEnabled = useConfigStore((s) => s.setConsoleEnabled);
	const emptyConsole = useStable(clearConsole);

	const hideConsole = useStable(() => setConsoleEnabled(false));

	return (
		<Group align="center">
			<ActionIcon onClick={emptyConsole} title="Clear console">
				<Icon color="light.4" path={mdiDelete} />
			</ActionIcon>

			<ActionIcon onClick={hideConsole} title="Hide console">
				<Icon color="light.4" path={mdiClose} />
			</ActionIcon>
		</Group>
	);
}

function ConsoleOutputEntry({ index, message, formatter }: { index: number; message: string; formatter: AnsiToHtml }) {
	return (
		<Text
			key={index}
			c="light.4"
			ff="JetBrains Mono"
			dangerouslySetInnerHTML={{ __html: formatter.toHtml(message) }}
		/>
	);
}

export function ConsolePane() {
	const messages = useDatabaseStore((s) => s.consoleOutput);
	const scroller = useRef<HTMLDivElement>(null);
	const theme = useMantineTheme();

	const convert = useMemo(
		() =>
			new AnsiToHtml({
				fg: "#fff",
				bg: "#000",
				newline: true,
				colors: {
					4: "#3993d4",
				},
			}),
		[]
	);

	useEffect(() => {
		if (scroller.current) {
			const { scrollTop, scrollHeight, clientHeight } = scroller.current;

			if (scrollHeight - scrollTop < clientHeight + 100) {
				scroller.current.scrollTop = scrollHeight;
			}
		}
	}, [messages]);

	return (
		<Panel title="Console" icon={mdiConsole} rightSection={<ConsoleActions />}>
			{messages.length === 0 && (
				<Center h="100%">
					<Text c="light.5">No messages to display</Text>
				</Center>
			)}
			<ScrollArea style={{ position: "absolute", inset: 12, top: 0 }} viewportRef={scroller}>
				{messages.map((message, index) => (
					<ConsoleOutputEntry key={index} index={index} message={message} formatter={convert} />
				))}
			</ScrollArea>
		</Panel>
	);
}
