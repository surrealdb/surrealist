import { ActionIcon, Center, Divider, Group, Pagination, Stack, Text } from "@mantine/core";
import { mdiClock, mdiCodeJson, mdiDatabase, mdiLightningBolt, mdiTable } from "@mdi/js";
import { useMemo } from "react";
import { useActiveTab } from "~/hooks/environment";
import { useIsLight } from "~/hooks/theme";
import { useState } from "react";
import { useLayoutEffect } from "react";
import { actions, store, useStoreValue } from "~/store";
import { useStable } from "~/hooks/stable";
import { Icon } from "~/components/Icon";
import { Panel } from "~/components/Panel";
import { DataTable } from "~/components/DataTable";
import { SurrealistEditor } from "~/components/SurrealistEditor";

interface PreviewProps {
	result: any;
	fontSize: number;
}

function JsonPreview({ result, fontSize }: PreviewProps) {
	const wordWrap = useStoreValue((state) => state.config.wordWrap);

	const contents = useMemo(() => {
		return JSON.stringify(result, null, 4);
	}, [result]);

	return (
		<SurrealistEditor
			language="json"
			value={contents}
			options={{
				readOnly: true,
				wordWrap: wordWrap ? "on" : "off",
				fontSize,
			}}
		/>
	);
}

function computeRowCount(response: any) {
	if (!response) {
		return 0;
	}

	// We can count an array, otherwise it's always 1 result (unless there is an error, in which case there is no result :D) 
	if (Array.isArray(response.result)) {
		return response.result.length;
	}

	return response.status == "ERR" ? 0 : 1;
}

export function ResultPane() {
	const isLight = useIsLight();
	const activeTab = useActiveTab();
	const fontZoomLevel = useStoreValue((state) => state.config.fontZoomLevel);
	const resultListing = useStoreValue((state) => state.config.resultListing);
	const responses = activeTab?.lastResponse || [];

	const [resultTab, setResultTab] = useState<number>(1);
	const response = responses[resultTab - 1];
	const showTabs = responses.length > 1;

	useLayoutEffect(() => {
		setResultTab(1);
	}, [responses.length]);

	const toggleResultView = useStable(() => {
		const newMode = resultListing == "table" ? "json" : "table";

		store.dispatch(actions.setResultListingMode(newMode));
	});

	const listingIcon = resultListing == "table" ? mdiCodeJson : mdiTable;
	const listingTitle = resultListing == "table" ? "Switch to JSON view" : "Switch to table view";

	const showDivider = response?.result?.length > 0 || response?.time;
	const rowCount = computeRowCount(response);

	return (
		<Panel
			title={showTabs ? `Result #${resultTab}` : "Result"}
			icon={mdiLightningBolt}
			rightSection={
				<Group align="center">
					{response?.result !== undefined && (
						<>
							<ActionIcon onClick={toggleResultView} title={listingTitle}>
								<Icon color="light.4" path={listingIcon} />
							</ActionIcon>

							{showDivider && (
								<Divider
									orientation="vertical"
									color={isLight ? 'light.0' : 'dark.5'}
								/>
							)}
						</>
					)}

					{response?.result?.length > 0 && (
						<>
							<Icon color="light.4" path={mdiDatabase} mr={-10} />
							<Text color="light.4" lineClamp={1}>
								{rowCount} {rowCount == 1 ? 'row' : 'rows'}
							</Text>
						</>
					)}
					{response?.time && (
						<>
							<Icon color="light.4" path={mdiClock} mr={-10} />
							<Text color="light.4" lineClamp={1}>
								{response.time}
							</Text>
						</>
					)}
				</Group>
			}>
			<div
				style={{
					position: "absolute",
					insetInline: 14,
					top: 0,
					bottom: showTabs ? 72 : 0,
				}}>
				{response ? (
					<>
						{response.status == "ERR" ? (
							<Text 
								color="red" 
								style={{
									whiteSpace: "pre-wrap",
									fontFamily: "monospace",
								}}
							>
								{response.result}
							</Text>
						) : response.result?.length === 0 ? (
							<Text color="light.4">No results found for query</Text>
						) : resultListing == "table" ? (
							<DataTable data={response.result} />
						) : (
							<JsonPreview result={response.result} fontSize={14 * fontZoomLevel} />
						)}
					</>
				) : (
					<Center h="100%" c="light.5">
						Execute a query to view the results
					</Center>
				)}
			</div>

			{showTabs && (
				<Stack
					spacing="xs"
					align="center"
					style={{
						position: "absolute",
						insetInline: 14,
						bottom: 12,
					}}>
					<Divider w="100%" color={isLight ? "light.0" : "dark.5"} />
					<Pagination total={responses.length} value={resultTab} onChange={setResultTab} />
				</Stack>
			)}
		</Panel>
	);
}
