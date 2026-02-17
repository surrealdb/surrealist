import { Icon, iconChat, iconChevronLeft, iconClose, iconList, iconSidekick } from "@surrealdb/ui";
import { Panel } from "react-resizable-panels";
import { useIsAuthenticated } from "~/hooks/cloud";
import { useSetting } from "~/hooks/config";
import { useSidekickStore } from "~/stores/sidekick";
import { ActionButton } from "../ActionButton";
import { ContentPane } from "../Pane";
import { PanelDragger } from "../Pane/dragger";
import { Sidekick } from ".";

export function SidekickPanel() {
	const isAuthed = useIsAuthenticated();
	const activeTitle = useSidekickStore((state) => state.activeTitle);
	const historyOpened = useSidekickStore((state) => state.historyOpened);

	const { toggleHistory } = useSidekickStore.getState();

	const [sidekickPanel, setSidekickPanel] = useSetting("behavior", "sidekickPanel");

	if (!sidekickPanel) {
		return;
	}

	return (
		<>
			<PanelDragger />
			<Panel
				order={3}
				minSize={33}
				defaultSize={33}
				maxSize={50}
			>
				<ContentPane
					p={0}
					title={`Sidekick - ${activeTitle ? activeTitle : "New chat"}`}
					icon={iconSidekick}
					rightSection={
						<>
							{isAuthed && (
								<ActionButton
									label={historyOpened ? "Return to chat" : "Show menu"}
									icon={iconChat}
									onClick={toggleHistory}
								>
									<Icon path={historyOpened ? iconChevronLeft : iconList} />
								</ActionButton>
							)}
							<ActionButton
								label="Hide Sidekick"
								onClick={() => setSidekickPanel(false)}
							>
								<Icon path={iconClose} />
							</ActionButton>
						</>
					}
				>
					<Sidekick
						inline
						chatPadding={10}
					/>
				</ContentPane>
			</Panel>
		</>
	);
}
