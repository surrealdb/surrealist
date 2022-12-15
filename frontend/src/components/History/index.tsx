import classes from './style.module.scss';
import { Button, Drawer, Group, Paper, ScrollArea, Stack, Text, Title, UnstyledButton, useMantineTheme } from "@mantine/core";
import { mdiDelete, mdiHistory } from "@mdi/js";
import { useState } from "react";
import { useStable } from "~/hooks/stable";
import { useActiveTab } from "~/hooks/tab";
import { useIsLight } from "~/hooks/theme";
import { actions, store, useStoreValue } from "~/store";
import { Icon } from "../Icon";
import { Spacer } from '../Scaffold/Spacer';
import dayjs from 'dayjs';

export function History() {
	const isLight = useIsLight();
	const theme = useMantineTheme();
	const activeTab = useActiveTab();
	const entries = useStoreValue(state => state.history);

	const [ showHistory, setShowHistory ] = useState(false);

	const openHistory = useStable(() => {
		setShowHistory(true);
	});

	const closeHistory = useStable(() => {
		setShowHistory(false);
	});

	const clearHistory = useStable(() => {
		store.dispatch(actions.clearHistory());
	});

	const insertQuery = useStable((query: string) => {
		if (!activeTab) {
			return;
		}

		store.dispatch(actions.updateTab({
			id: activeTab?.id,
			query: query
		}));

		closeHistory();
	});

	return (
		<>
			<Button
				px="xs"
				color={isLight ? 'light.0' : 'dark.4'}
				title="Query history"
				onClick={openHistory}
			>
				<Icon
					path={mdiHistory}
					color={isLight ? 'light.8' : 'white'}
				/>
			</Button>

			<Drawer
				opened={showHistory}
				onClose={closeHistory}
				position="right"
				padding="xl"
				size={425}
				title={
					<Title size={16} color={isLight ? 'light.6' : 'white'}>
						Query history
					</Title>
				}
			>
				{entries.length === 0 ? (
					<Text
						align="center"
						color={isLight ? 'light.3' : 'white'}
						mt={60}
					>
						<Stack spacing="xs">
							<Icon path={mdiHistory} mx="auto" size="lg" />
							Your history is empty
						</Stack>
					</Text>
				) : (
					<ScrollArea
						style={{ height: 'calc(100vh - 68px)' }}
					>
						{entries.map((entry, i) => (
							<UnstyledButton
								key={i}
								color={isLight ? 'light.0' : 'dark.4'}
								onClick={() => insertQuery(entry.query)}
								className={classes.entry}
								style={{ borderColor: theme.fn.themeColor(isLight ? 'light.0' : 'dark.3') }}
								mb="xl"
								p="xs"
							>
								<Text
									ff="JetBrains Mono"
									lineClamp={3}
									weight={600}
								>
									{entry.query}
								</Text>
								<Text
									c={isLight ? 'light.3' : 'white'}
									mt={6}
								>
									{dayjs(entry.timestamp).fromNow()}
								</Text>
							</UnstyledButton>
						))}

						<Button
							color="red"
							size="xs"
							fullWidth
							leftIcon={<Icon path={mdiDelete} />}
							onClick={clearHistory}
							mb="xl"
						>
							Clear history
						</Button>
					</ScrollArea>
				)}
			</Drawer>
		</>
	);
}