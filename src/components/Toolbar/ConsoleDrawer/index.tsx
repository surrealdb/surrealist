import { useEffect, useRef, useMemo } from "react";
import { ActionIcon, Badge, Center, Drawer, Group, Paper, ScrollArea, Text, Tooltip } from "@mantine/core";
import { Icon } from "~/components/Icon";
import AnsiToHtml from "ansi-to-html";
import { useDatabaseStore } from "~/stores/database";
import { ModalTitle } from "~/components/ModalTitle";
import { Spacer } from "~/components/Spacer";
import { useIsLight } from "~/hooks/theme";
import { iconClose, iconDelete } from "~/util/icons";

function ConsoleOutputEntry({ index, message, formatter }: { index: number; message: string; formatter: AnsiToHtml }) {
	return (
		<Text
			key={index}
			c="slate"
			ff="JetBrains Mono"
			dangerouslySetInnerHTML={{ __html: formatter.toHtml(message) }}
		/>
	);
}

export interface ConsoleDrawerProps {
	opened: boolean;
	onClose: () => void;
}

export function ConsoleDrawer(props: ConsoleDrawerProps) {
	const { clearConsole } = useDatabaseStore.getState();

	const isServing = useDatabaseStore((s) => s.isServing);
	const messages = useDatabaseStore((s) => s.consoleOutput);
	const scroller = useRef<HTMLDivElement>(null);
	const isLight = useIsLight();

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
		<Drawer
			opened={props.opened}
			onClose={props.onClose}
			position="bottom"
			styles={{
				content: {
					position: 'relative'
				}
			}}
		>
			<Group mb="md" gap="sm">
				<ModalTitle>
					Serving output
				</ModalTitle>

				{isServing ? (
					<Badge
						variant="dot"
						color="green"
					>
						Online
					</Badge>
				) : (
					<Badge
						variant="dot"
						color="pink.9"
					>
						Offline
					</Badge>
				)}

				<Spacer />

				<Tooltip label="Clear console">
					<ActionIcon
						onClick={clearConsole}
						aria-label="Clear console logs"
					>
						<Icon path={iconDelete} />
					</ActionIcon>
				</Tooltip>

				<ActionIcon
					onClick={props.onClose}
					aria-label="Close console drawer"
				>
					<Icon path={iconClose} />
				</ActionIcon>
			</Group>

			{messages.length === 0 && (
				<Center h="100%">
					<Text c="slate">No messages to display</Text>
				</Center>
			)}

			<Paper
				mt="xs"
				p="xs"
				bg={isLight ? 'slate.1' : 'slate.9'}
				style={{ position: "absolute", inset: 12, top: 52 }}
			>
				<ScrollArea
					h="100%"
					viewportRef={scroller}
				>
					{messages.map((message, index) => (
						<ConsoleOutputEntry key={index} index={index} message={message} formatter={convert} />
					))}
				</ScrollArea>
			</Paper>
		</Drawer>
	);
}
