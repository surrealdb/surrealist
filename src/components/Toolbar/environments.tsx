import classes from "./style.module.scss";
import { Button, Center, Grid, Group, Modal, ScrollArea, Stack, TextInput } from "@mantine/core";
import { useIsLight } from "~/hooks/theme";
import { ConnectionDetails } from "../ConnectionDetails";
import { store, useStoreValue } from "~/store";
import { mdiClose, mdiPlus } from "@mdi/js";
import { Icon } from "../Icon";
import { ChangeEvent, useEffect, useState } from "react";
import { Text } from "@mantine/core";
import { useStable } from "~/hooks/stable";
import { useImmer } from "use-immer";
import { Spacer } from "../Spacer";
import { SurrealistEnvironment } from "~/types";
import { newId } from "~/util/helpers";
import { ModalTitle } from "../ModalTitle";
import { openConnection } from "~/database";
import { removeSession, setEnvironments } from "~/stores/config";

export interface EnvironmentsProps {
	opened: boolean;
	onClose: () => void;
}

function buildName(n: number) {
	return `Environment ${n ? n + 1 : ""}`.trim();
}

export function Environments({ opened, onClose }: EnvironmentsProps) {
	const liveTabs = useStoreValue((state) => state.config.tabs);
	const liveEnvs = useStoreValue((state) => state.config.environments);
	const isLight = useIsLight();

	const [viewingEnv, setViewingEnv] = useState("");
	const [envList, setEnvList] = useImmer<SurrealistEnvironment[]>([]);
	const [removedIds, setRemovedIds] = useImmer<string[]>([]);

	const selected = envList.find((item) => item.id === viewingEnv);

	const openEnvironment = useStable((id: string) => {
		const env = envList.find((item) => item.id === id);

		if (!env) return;

		setViewingEnv(id);
	});

	const updateConnection = useStable((updater: any) => {
		setEnvList((draft) => {
			const env = draft.find((item) => item.id === viewingEnv);

			if (env) {
				updater(env.connection);
			}
		});
	});

	const updateName = useStable((e: ChangeEvent<HTMLInputElement>) => {
		setEnvList((draft) => {
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
		} while (envList.some((env) => env.name === tabName));

		const envId = newId();

		setEnvList((draft) => {
			draft.push({
				id: envId,
				name: tabName,
				connection: {},
			});
		});
	});

	const deleteCurrent = useStable(() => {
		setEnvList((draft) => {
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
				store.dispatch(removeSession(tab.id));
			}
		}

		store.dispatch(setEnvironments(envList));

		onClose();
		openConnection();
	});

	useEffect(() => {
		if (opened && viewingEnv === "") {
			setEnvList(liveEnvs);
			setViewingEnv(liveEnvs[0]?.id ?? "");
		}
	}, [opened, liveEnvs]);

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			size={850}
			title={<ModalTitle>Manage Environments</ModalTitle>}
		>
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
							inset: 0,
							bottom: 24,
							right: 12,
							top: 12
						}}>
						<Stack spacing="xs">
							{envList.map((item) => {
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
									disabled={envList.length <= 1}>
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
