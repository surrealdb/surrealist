import classes from "./style.module.scss";

import { Box, Group, SegmentedControl, Stack, noop } from "@mantine/core";

import type { SelectionRange } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { Image } from "@mantine/core";
import { memo, useState } from "react";
import { Panel, PanelGroup } from "react-resizable-panels";
import { InPortal, createHtmlPortalNode } from "react-reverse-portal";
import { adapter } from "~/adapter";
import { MiniAdapter } from "~/adapter/mini";
import surrealistIcon from "~/assets/images/icon.webp";
import { Link } from "~/components/Link";
import { PanelDragger } from "~/components/Pane/dragger";
import { Spacer } from "~/components/Spacer";
import { setEditorText } from "~/editor/helpers";
import { useLogoUrl } from "~/hooks/brand";
import { useSetting } from "~/hooks/config";
import { useActiveQuery } from "~/hooks/connection";
import { useEventSubscription } from "~/hooks/event";
import { usePanelMinSize } from "~/hooks/panels";
import { useConnectionAndView } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useConfigStore } from "~/stores/config";
import { SetQueryEvent } from "~/util/global-events";
import { QueryPane } from "../QueryPane";
import { ResultPane } from "../ResultPane";
import { VariablesPane } from "../VariablesPane";

const switchPortal = createHtmlPortalNode();

const QueryPaneLazy = memo(QueryPane);
const VariablesPaneLazy = memo(VariablesPane);
const ResultPaneLazy = memo(ResultPane);

export function MiniQueryView() {
	const { updateQueryTab } = useConfigStore();
	const logoUrl = useLogoUrl();

	const [orientation] = useSetting("appearance", "queryOrientation");
	const [editor, setEditor] = useState(new EditorView());
	const [variablesValid, setVariablesValid] = useState(true);
	const [connection] = useConnectionAndView();

	const [selection, setSelection] = useState<SelectionRange>();
	const active = useActiveQuery();

	const miniAppearance = adapter instanceof MiniAdapter ? adapter.appearance : "normal";
	const miniCorners = adapter instanceof MiniAdapter ? adapter.corners : undefined;

	const showVariables = !!active?.showVariables;

	const setShowVariables = useStable((showVariables: boolean) => {
		if (!active || !connection) return;

		updateQueryTab(connection, {
			id: active?.id,
			showVariables,
		});
	});

	const closeVariables = useStable(() => {
		setShowVariables(false);
	});

	const [hasLineNumbers] = useSetting("appearance", "queryLineNumbers");
	const lineNumbers = adapter instanceof MiniAdapter ? adapter.linenumbers : hasLineNumbers;

	useEventSubscription(SetQueryEvent, (query) => {
		if (editor) {
			setEditorText(editor, query);
		}
	});

	const [minResultHeight, wrapperRef] = usePanelMinSize(48, "height");

	return (
		active && (
			<Stack
				gap="md"
				h="100%"
			>
				<InPortal node={switchPortal}>
					<SegmentedControl
						data={["Query", "Variables"]}
						value={showVariables ? "Variables" : "Query"}
						onChange={() => setShowVariables(!showVariables)}
						className={classes.switcher}
						color="slate.5"
						radius="xs"
					/>
				</InPortal>

				{miniAppearance === "normal" && (
					<Group>
						<Link href="https://surrealdb.com/surrealist">
							<Group>
								<Image
									h={18}
									w="auto"
									src={surrealistIcon}
								/>
								<Image
									src={logoUrl}
									// style={{ pointerEvents: "none" }}
									h={18}
									w="auto"
								/>
							</Group>
						</Link>
						<Spacer />
					</Group>
				)}

				<Box flex={1}>
					<Box
						flex={1}
						h="100%"
						ref={wrapperRef}
					>
						<PanelGroup direction={orientation}>
							<Panel minSize={15}>
								{showVariables ? (
									<VariablesPaneLazy
										isValid={variablesValid}
										switchPortal={switchPortal}
										setIsValid={setVariablesValid}
										closeVariables={closeVariables}
										editor={editor}
										corners={miniCorners}
										lineNumbers={lineNumbers}
									/>
								) : (
									<QueryPaneLazy
										corners={miniCorners}
										editor={editor}
										activeTab={active}
										switchPortal={switchPortal}
										selection={selection}
										showVariables={showVariables}
										lineNumbers={lineNumbers}
										onSaveQuery={noop}
										setShowVariables={setShowVariables}
										onSelectionChange={setSelection}
										onEditorMounted={setEditor}
									/>
								)}
							</Panel>
							<PanelDragger />
							<Panel
								minSize={orientation === "horizontal" ? 35 : minResultHeight}
								defaultSize={50}
							>
								<ResultPaneLazy
									activeTab={active}
									selection={selection}
									editor={editor}
									corners={miniCorners}
								/>
							</Panel>
						</PanelGroup>
					</Box>
				</Box>
			</Stack>
		)
	);
}

export default MiniQueryView;
