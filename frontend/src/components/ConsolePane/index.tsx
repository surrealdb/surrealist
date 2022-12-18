import {useActiveTab} from "~/hooks/tab";
import {useState, useLayoutEffect, useEffect, useRef} from "react";
import {Panel} from "~/components/Panel";
import {mdiCodeJson, mdiTable, mdiClock, mdiConsole, mdiWindowMinimize} from "@mdi/js";
import {Group, Text, Tabs, useMantineTheme} from "@mantine/core";
import {Icon} from "~/components/Icon";
import {useStoreValue} from "~/store";
import {ConsoleOutputMessage} from "~/typings";
import AnsiToHtml from "ansi-to-html";

function ConsoleTitle({toggleConsoleMinimize}: { toggleConsoleMinimize: () => void }) {
	return (
		<Group align="center">
			<a type="button" onClick={toggleConsoleMinimize}>
				<Icon color="light.4" path={mdiWindowMinimize} />
			</a>
		</Group>
	);
}

function ConsoleBody({height}: { height: number }) {
	const messages       = useStoreValue(state => state.consoleOutput);
	const theme          = useMantineTheme();
	const consoleWrapper = useRef<HTMLDivElement>(null);

	const convert = new AnsiToHtml({
		fg      : theme.fn.themeColor("light.4"),
		bg      : theme.fn.themeColor("dark.0"),
		newline : true,
	});

	const originalColors            = (convert as any).options.colors;
	originalColors[4]               = "#3993d4"; //theme.fn.themeColor("light.4");
	(convert as any).options.colors = originalColors;

	useEffect(() => {
		if (consoleWrapper.current) {
			const {scrollTop, scrollHeight, clientHeight} = consoleWrapper.current;
			if (scrollHeight - scrollTop < clientHeight + 100) {
				consoleWrapper.current.scrollTop = scrollHeight;
			}
		}
	}, [messages]);

	return (
		<div
			ref={consoleWrapper}
			style={{overflowY : "auto", flex : "auto", height : "100%", maxHeight : height > 250 ? 250 : height}}
		>
			{messages.map((message, index) =>
				<ConsoleOutputEntry
					key={index}
					index={index}
					message={message}
					formatter={convert}
				/>
			)}
		</div>
	);
}

function ConsoleOutputEntry({index, message, formatter}: {
	index: number,
	message: ConsoleOutputMessage,
	formatter: AnsiToHtml,
}) {
	return (
		<Text
			key={index}
			color="light.4"
			dangerouslySetInnerHTML={{__html : formatter.toHtml(message.message)}}
		>
		</Text>
	);
}

export function ConsolePane() {
	const [isMinimized, setMinimized] = useState(true);

	const toggleConsoleMinimize = () => {
		setMinimized(!isMinimized);
	};

	const [containerHeight, setContainerHeight] = useState(120);

	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setContainerHeight(containerRef.current!.clientHeight);
	});

	return (
		<div ref={containerRef} style={{flex : 1}}>
			<Panel
				title="Console"
				icon={mdiConsole}
				rightSection={<ConsoleTitle toggleConsoleMinimize={toggleConsoleMinimize} />}
			>
				{/*{isMinimized ? (<></>) : (<ConsoleBody />)}*/}
				<ConsoleBody height={containerHeight} />
			</Panel>
		</div>
	);
}
