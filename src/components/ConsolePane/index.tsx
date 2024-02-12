import { useEffect, useRef, useMemo } from "react";
import { ContentPane } from "~/components/Pane";
import { mdiClose, mdiConsole, mdiDelete } from "@mdi/js";
import { ActionIcon, Center, Group, ScrollArea, Text } from "@mantine/core";
import { Icon } from "~/components/Icon";
import AnsiToHtml from "ansi-to-html";
import { useStable } from "~/hooks/stable";
import { useDatabaseStore } from "~/stores/database";

interface ConsoleActionsProps {
	onClose: () => void;
}

function ConsoleActions(props: ConsoleActionsProps) {
	const clearConsole = useDatabaseStore((s) => s.clearConsole);
	const emptyConsole = useStable(clearConsole);

	return (
		<Group align="center">
			<ActionIcon onClick={emptyConsole} title="Clear console">
				<Icon color="light.4" path={mdiDelete} />
			</ActionIcon>

			<ActionIcon onClick={props.onClose} title="Hide console">
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

export interface ConsolePaneProps {
	onClose: () => void;
}

export function ConsolePane(props: ConsolePaneProps) {
	const messages = useDatabaseStore((s) => s.consoleOutput);
	const scroller = useRef<HTMLDivElement>(null);

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
		<ContentPane
			title="Console"
			icon={mdiConsole}
			rightSection={
				<ConsoleActions onClose={props.onClose} />
			}
		>
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
		</ContentPane>
	);
}
