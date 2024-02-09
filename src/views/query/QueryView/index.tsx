import surrealistIcon from "~/assets/surrealist.png";
import { QueryPane } from "../QueryPane";
import { ResultPane } from "../ResultPane";
import { VariablesPane } from "../../query/VariablesPane";
import { Splitter } from "~/components/Splitter";
import { TabsPane } from "../TabsPane";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { HistoryDrawer } from "../HistoryDrawer";
import { isEmbed } from "~/adapter";
import { Box, Group, Stack, Text } from "@mantine/core";
import { Spacer } from "~/components/Spacer";
import { Actions } from "../Actions";
import { Image } from "@mantine/core";

export function QueryView() {
	const [showVariables, showVariablesHandle] = useDisclosure();
	const [variablesValid, setVariablesValid] = useState(true);
	const [queryValid, setQueryValid] = useState(true);

	const [showHistory, showHistoryHandle] = useDisclosure();
	const [showSaved, showSavedHandle] = useDisclosure();

	return (
		<Stack
			gap="md"
			h="100%"
		>
			{isEmbed && (
				<Group>
					<Image
						src={surrealistIcon}
						style={{ pointerEvents: "none" }}
						height={26}
						width={26}
					/>
					<Text fz="xl" fw={600}>
						Surrealist
					</Text>
					<Spacer />
					<Actions
						showVariables={showVariables}
						canQuery={queryValid && variablesValid}
						openVariables={showVariablesHandle.open}
					/>
				</Group>
			)}	
			<Box flex={1}>
				<Splitter
					minSize={250}
					maxSize={500}
					startPane={
						!isEmbed && (
							<TabsPane
								openHistory={showHistoryHandle.open}
								openSaved={showSavedHandle.open}
							/>
						)
					}
				>
					<Splitter
						direction="vertical"
						minSize={150}
						bufferSize={150}
						initialSize={450}
						endPane={
							<ResultPane />
						}
					>
						<Splitter
							minSize={300}
							initialSize={500}
							endPane={
								showVariables && (
									<VariablesPane
										isValid={variablesValid}
										setIsValid={setVariablesValid}
										closeVariables={showVariablesHandle.close}
									/>
								)
							}
						>
							<QueryPane
								showVariables={showVariables}
								canQuery={queryValid && variablesValid}
								isValid={queryValid}
								setIsValid={setQueryValid}
								openVariables={showVariablesHandle.open}
							/>
						</Splitter>
					</Splitter>
				</Splitter>
			</Box>

			<HistoryDrawer
				opened={showHistory}
				onClose={showHistoryHandle.close}
			/>
		</Stack>
	);
}
