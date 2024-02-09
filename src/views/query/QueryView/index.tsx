import { QueryPane } from "../QueryPane";
import { ResultPane } from "../ResultPane";
import { VariablesPane } from "../../query/VariablesPane";
import { Splitter } from "~/components/Splitter";
import { TabsPane } from "../TabsPane";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { HistoryDrawer } from "../HistoryDrawer";

export function QueryView() {
	const [showVariables, showVariablesHandle] = useDisclosure();
	const [variablesValid, setVariablesValid] = useState(true);
	const [queryValid, setQueryValid] = useState(true);

	const [showHistory, showHistoryHandle] = useDisclosure();
	const [showSaved, showSavedHandle] = useDisclosure();

	return (
		<>
			<Splitter
				minSize={250}
				maxSize={500}
				startPane={
					<TabsPane
						openHistory={showHistoryHandle.open}
						openSaved={showSavedHandle.open}
					/>
				}
			>
				<Splitter
					direction="vertical"
					minSize={250}
					bufferSize={200}
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

			<HistoryDrawer
				opened={showHistory}
				onClose={showHistoryHandle.close}
			/>
		</>
	);
}
