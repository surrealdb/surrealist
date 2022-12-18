import { useState, useEffect, useRef } from "react";
import { Panel } from "~/components/Panel";
import { mdiConsole, mdiDelete, mdiWindowMinimize } from "@mdi/js";
import { ActionIcon, Group, ScrollArea, Text, useMantineTheme } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { actions, store, useStoreValue } from "~/store";
import { ConsoleOutputMessage } from "~/typings";
import AnsiToHtml from "ansi-to-html";
import { useStable } from "~/hooks/stable";

function ConsoleActions({ toggleConsoleMinimize }: { toggleConsoleMinimize: () => void }) {

	const clearConsole = useStable(() => {
		store.dispatch(actions.clearConsole());
	});

	return (
		<Group align="center">
			<ActionIcon onClick={clearConsole} >
				<Icon color="light.4" path={mdiDelete} />
			</ActionIcon>

			<ActionIcon onClick={toggleConsoleMinimize} >
				<Icon color="light.4" path={mdiWindowMinimize} />
			</ActionIcon>
		</Group>
	);
}

function ConsoleBody() {
	const messages = useStoreValue(state => state.consoleOutput);
	const scroller = useRef<HTMLDivElement>(null);
	const theme = useMantineTheme();

	const convert = new AnsiToHtml({
		fg: theme.fn.themeColor("light.4"),
		bg: theme.fn.themeColor("dark.0"),
		newline: true,
		colors: {
			4: '#3993d4'
		}
	});

	useEffect(() => {
		if (scroller.current) {
			const { scrollTop, scrollHeight, clientHeight } = scroller.current;

			if (scrollHeight - scrollTop < clientHeight + 100) {
				scroller.current.scrollTop = scrollHeight;
			}
		}
	}, [messages]);

	return (
		<ScrollArea
			style={{ position: 'absolute', inset: 12, top: 0 }}
			viewportRef={scroller}
		>
			{messages.map((message, index) =>
				<ConsoleOutputEntry
					key={index}
					index={index}
					message={message}
					formatter={convert}
				/>
			)}
		</ScrollArea>
	);
}

function ConsoleOutputEntry({ index, message, formatter }: {
	index: number,
	message: ConsoleOutputMessage,
	formatter: AnsiToHtml,
}) {
	return (
		<Text
			key={index}
			color="light.4"
			ff="JetBrains Mono"
			dangerouslySetInnerHTML={{ __html: formatter.toHtml(message.message) }}
		>
		</Text>
	);
}

export function ConsolePane() {
	const [isMinimized, setMinimized] = useState(true);

	const toggleConsoleMinimize = () => {
		setMinimized(!isMinimized);
	};

	// const [containerHeight, setContainerHeight] = useState(120);

	// const containerRef = useRef<HTMLDivElement>(null);

	// useEffect(() => {
	// 	setContainerHeight(containerRef.current!.clientHeight);
	// });

	return (
		<Panel
			title="Console"
			icon={mdiConsole}
			rightSection={<ConsoleActions toggleConsoleMinimize={toggleConsoleMinimize} />}
		>
			{/*{isMinimized ? (<></>) : (<ConsoleBody />)}*/}
			<ConsoleBody />
		</Panel>
	);
}
