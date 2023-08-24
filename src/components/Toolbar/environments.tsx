import classes from "./style.module.scss";
import { Button, Center, Grid, Group, Modal, ScrollArea, Stack, TextInput } from "@mantine/core";
import { useIsLight } from "~/hooks/theme";
import { ConnectionDetails } from "../ConnectionDetails";
import { actions, store, useStoreValue } from "~/store";
import { mdiClose, mdiPlus } from "@mdi/js";
import { Icon } from "../Icon";
import { ChangeEvent, useEffect, useState } from "react";
import { Text } from "@mantine/core";
import { useStable } from "~/hooks/stable";
import { useImmer } from "use-immer";
import { Spacer } from "../Spacer";
import { SurrealistEnvironment } from "~/types";
import { newId, updateConfig } from "~/util/helpers";

export interface EnvironmentsProps {
	opened: boolean;
	onClose: () => void;
	onSave: () => void;
}

function buildName(n: number) {
	return `Environment ${n ? n + 1 : ""}`.trim();
}

export function Environments({ opened, onClose, onSave }: EnvironmentsProps) {
	const liveTabs = useStoreValue((state) => state.config.tabs);
	const liveEnvs = useStoreValue((state) => state.config.environments);
	const isLight = useIsLight();

	const [viewingEnv, setViewingEnv] = useState("");
	const [environments, setEnvironments] = useImmer<SurrealistEnvironment[]>([]);
	const [removedIds, setRemovedIds] = useImmer<string[]>([]);

	const selected = environments.find((item) => item.id === viewingEnv);

	const openEnvironment = useStable((id: string) => {
		const env = environments.find((item) => item.id === id);

		if (!env) return;

		setViewingEnv(id);
	});

	const updateConnection = useStable((updater: any) => {
		setEnvironments((draft) => {
			const env = draft.find((item) => item.id === viewingEnv);

			if (env) {
				updater(env.connection);
			}
		});
	});

	const updateName = useStable((e: ChangeEvent<HTMLInputElement>) => {
		setEnvironments((draft) => {
			const env = draft.find((item) => item.id === viewingEnv);

			if (env) {
				env.name = e.target.value;
			}
		});
	});

	const addEnvironment = useStable(() => {
		let tabName = "";
		let counter = 0;

		do {
			tabName = buildName(counter);
			counter++;
		} while (environments.some((env) => env.name === tabName));

		const envId = newId();

		setEnvironments((draft) => {
			draft.push({
				id: envId,
				name: tabName,
				connection: {},
			});
		});
	});

	const deleteCurrent = useStable(() => {
		setEnvironments((draft) => {
			const index = draft.findIndex((item) => item.id === viewingEnv);

			if (index !== -1) {
				draft.splice(index, 1);
			}
		});

		setRemovedIds((draft) => {
			draft.push(viewingEnv);
		});

		setViewingEnv("");
	});

	const saveEnvironments = useStable(() => {
		for (const tab of liveTabs) {
			if (removedIds.includes(tab.environment)) {
				store.dispatch(actions.removeTab(tab.id));
			}
		}

		store.dispatch(actions.setEnvironments(environments));

		onClose();
		onSave();
		updateConfig();
	});

	useEffect(() => {
		if (opened && viewingEnv === "") {
			setEnvironments(liveEnvs);
			setViewingEnv(liveEnvs[0]?.id ?? "");
		}
	}, [opened, liveEnvs]);

	return (
		<Modal opened={opened} onClose={onClose} size={850} title="Manage environments">
			<Grid h={350} style={{ gap: 12 }}>
				<Grid.Col
					pr="md"
					span={4}
					sx={(theme) => ({
						borderRight: `2px solid ${theme.fn.themeColor(isLight ? "light.0" : "dark.4")}`,
						position: "relative",
					})}>
					<ScrollArea
						style={{
							position: "absolute",
							inset: 12,
							bottom: 24,
							right: 12,
						}}>
						<Stack spacing="xs">
							{environments.map((item) => {
								const isActive = item.id === viewingEnv;

								return (
									<Button
										key={item.id}
										px={12}
										c={isLight ? "black" : "white"}
										color={isActive ? (isLight ? "light.1" : "dark.7") : "light"}
										variant={isActive ? "filled" : "subtle"}
										className={classes.entryButton}
										onClick={() => openEnvironment(item.id)}>
										{item.name}
									</Button>
								);
							})}

							<Button
								px={12}
								color="light"
								variant="subtle"
								className={classes.manageButton}
								leftIcon={<Icon path={mdiPlus} />}
								onClick={addEnvironment}>
								Add environment
							</Button>
						</Stack>
					</ScrollArea>
				</Grid.Col>
				<Grid.Col span="auto">
					{selected ? (
						<>
							<Group mb="xl">
								<TextInput
									placeholder="Environment name"
									variant="unstyled"
									style={{ flex: 1 }}
									value={selected.name}
									onChange={updateName}
									autoFocus
									styles={(theme) => ({
										input: {
											fontSize: 16,
											color: isLight ? theme.fn.themeColor("dark.9") : theme.fn.themeColor("gray.0"),
											fontWeight: 600,
										},
									})}
								/>
								<Button
									variant="outline"
									rightIcon={<Icon path={mdiClose} />}
									color="red.5"
									onClick={deleteCurrent}
									disabled={environments.length <= 1}>
									Remove
								</Button>
							</Group>

							{/* <Title
								mt="xl"
								mb="xs"
								size={14}
								color={isLight ? 'light.6' : 'white'}
							>
								Default connection details
							</Title> */}

							<ConnectionDetails value={selected.connection as any} onChange={updateConnection} optional />
						</>
					) : (
						<Center h="100%">
							<Text color="dark.2" mt={-50}>
								Select an environment
							</Text>
						</Center>
					)}
				</Grid.Col>
			</Grid>
			<Group>
				<Button color={isLight ? "light.5" : "light.3"} variant="light" onClick={onClose}>
					Close
				</Button>
				<Spacer />
				<Button color="surreal" onClick={saveEnvironments}>
					Save details
				</Button>
			</Group>
		</Modal>
	);
}
