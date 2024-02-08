import { QueryPane } from "../QueryPane";
import { ResultPane } from "../ResultPane";
import { VariablesPane } from "../../query/VariablesPane";
import { Splitter } from "~/components/Splitter";
import { TabsPane } from "../TabsPane";
import { useDisclosure } from "@mantine/hooks";

export function QueryView() {
	const [showVariables, showVariablesHandle] = useDisclosure();

	return (
		<Splitter
			minSize={250}
			maxSize={500}
			startPane={
				<TabsPane />
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
					minSize={250}
					initialSize={500}
					endPane={
						showVariables && (
							<VariablesPane
								closeVariables={showVariablesHandle.close}
							/>
						)
					}
				>
					<QueryPane
						showVariables={showVariables}
						openVariables={showVariablesHandle.open}
					/>
				</Splitter>
			</Splitter>
		</Splitter>
	);
}
