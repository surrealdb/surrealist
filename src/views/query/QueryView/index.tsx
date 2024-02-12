import surrealistIcon from "~/assets/surrealist.png";
import { QueryPane } from "../QueryPane";
import { ResultPane } from "../ResultPane";
import { VariablesPane } from "../VariablesPane";
import { TabsPane } from "../TabsPane";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { HistoryDrawer } from "../HistoryDrawer";
import { isEmbed } from "~/adapter";
import { Box, Group, Stack } from "@mantine/core";
import { Spacer } from "~/components/Spacer";
import { Actions } from "../Actions";
import { Image } from "@mantine/core";
import { PanelGroup, Panel } from "react-resizable-panels";
import { PanelDragger } from "~/components/Pane/dragger";
import { TextLogo } from "~/components/TextLogo";

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
						height={20}
						width={20}
					/>
					<TextLogo h={16} />
					<Spacer />
					<Actions
						showVariables={showVariables}
						canQuery={queryValid && variablesValid}
						openVariables={showVariablesHandle.open}
					/>
				</Group>
			)}	
			<Box flex={1}>
				<PanelGroup direction="horizontal">
					{!isEmbed && (
						<>
							<Panel defaultSize={15} minSize={15} maxSize={25}>
								<TabsPane
									openHistory={showHistoryHandle.open}
									openSaved={showSavedHandle.open}
								/>
							</Panel>
							<PanelDragger />
						</>
					)}
					<Panel minSize={10}>
						<PanelGroup direction="vertical">
							<Panel minSize={25}>
								<PanelGroup direction="horizontal">
									<Panel minSize={25}>
										<QueryPane
											showVariables={showVariables}
											canQuery={queryValid && variablesValid}
											isValid={queryValid}
											setIsValid={setQueryValid}
											openVariables={showVariablesHandle.open}
										/>
									</Panel>
									{showVariables && (
										<>
											<PanelDragger />
											<Panel defaultSize={25} minSize={25} maxSize={40}>
												<VariablesPane
													isValid={variablesValid}
													setIsValid={setVariablesValid}
													closeVariables={showVariablesHandle.close}
												/>
											</Panel>
										</>
									)}
								</PanelGroup>
							</Panel>
							<PanelDragger />
							<Panel minSize={25}>
								<ResultPane />
							</Panel>
						</PanelGroup>
					</Panel>
				</PanelGroup>
			</Box>

			<HistoryDrawer
				opened={showHistory}
				onClose={showHistoryHandle.close}
			/>
		</Stack>
	);
}
