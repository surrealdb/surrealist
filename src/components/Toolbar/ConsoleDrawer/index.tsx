import { useEffect, useRef, useMemo } from "react";
import { mdiClose, mdiDelete } from "@mdi/js";
import { ActionIcon, Badge, Center, Drawer, Group, Paper, ScrollArea, Text } from "@mantine/core";
import { Icon } from "~/components/Icon";
import AnsiToHtml from "ansi-to-html";
import { useStable } from "~/hooks/stable";
import { useDatabaseStore } from "~/stores/database";
import { ModalTitle } from "~/components/ModalTitle";
import { Spacer } from "~/components/Spacer";
import { useIsLight } from "~/hooks/theme";

interface ConsoleActionsProps {
	onClose: () => void;
}

function ConsoleActions(props: ConsoleActionsProps) {
	const clearConsole = useDatabaseStore((s) => s.clearConsole);
	const emptyConsole = useStable(clearConsole);

	return (
		<Group align="center">
			<ActionIcon onClick={emptyConsole} title="Clear console">
				<Icon path={mdiDelete} />
			</ActionIcon>

			<ActionIcon onClick={props.onClose} title="Hide console">
				<Icon path={mdiClose} />
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
			withCloseButton={false}
			styles={{
				content: {
					position: 'relative'
				}
			}}
		>
			<Group mb="md" gap="sm">
				<ModalTitle>
					Local database console
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
						color="red"
					>
						Offline
					</Badge>
				)}

				{/* <Badge
					color={isLight ? "slate.0" : "slate.9"}
					radius="sm"
					c="inherit"
				>
					{connection?.queryHistory?.length?.toString()}
				</Badge> */}

				<Spacer />

				<ActionIcon onClick={clearConsole} title="Clear console">
					<Icon path={mdiDelete} />
				</ActionIcon>

				<ActionIcon onClick={props.onClose}>
					<Icon path={mdiClose} />
				</ActionIcon>
			</Group>
			
			{messages.length === 0 && (
				<Center h="100%">
					<Text c="light.5">No messages to display</Text>
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
