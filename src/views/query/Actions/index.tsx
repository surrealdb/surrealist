import { ActionIcon, Button, Tooltip } from "@mantine/core";
import { isEmbed } from "~/adapter";
import { Icon } from "~/components/Icon";
import { executeQuery } from "~/database";
import { format_query } from "~/generated/surrealist-embed";
import { useStable } from "~/hooks/stable";
import { useConfigStore } from "~/stores/config";
import { TabQuery } from "~/types";
import { showError } from "~/util/helpers";
import { iconCursor, iconStar, iconText, iconTune } from "~/util/icons";

export interface ActionsProps {
	queryTab: TabQuery;
	showVariables: boolean;
	onSaveQuery: () => void;
	onToggleVariables: () => void;
}

export function Actions({ queryTab, showVariables, onSaveQuery, onToggleVariables }: ActionsProps) {
	const { updateQueryTab } = useConfigStore.getState();

	const runQuery = useStable(() => {
		executeQuery();
	});

	const handleFormat = useStable(() => {
		const formatted = format_query(queryTab.query);

		if (formatted) {
			updateQueryTab({
				id : queryTab.id,
				query: formatted
			});
		} else {
			showError('Formatting failed', 'Could not format query');
		}
	});

	const isInvalid = queryTab.queryType === "invalid";

	return (
		<>
			{!isEmbed && (
				<Tooltip label="Save query">
					<ActionIcon
						onClick={onSaveQuery}
						variant="light"
					>
						<Icon path={iconStar} />
					</ActionIcon>
				</Tooltip>
			)}

			<Tooltip label="Format query">
				<ActionIcon
					onClick={handleFormat}
					variant="light"
				>
					<Icon path={iconText} />
				</ActionIcon>
			</Tooltip>

			<Tooltip label={showVariables ? "Hide variables" : "Show variables"}>
				<ActionIcon
					onClick={onToggleVariables}
					variant="light"
				>
					<Icon path={iconTune} />
				</ActionIcon>
			</Tooltip>

			<Button
				size="xs"
				radius="xs"
				onClick={runQuery}
				color={isInvalid ? "red" : "surreal"}
				variant={isInvalid ? "filled" : "gradient"}
				style={{ border: "none" }}
				rightSection={
					<Icon path={iconCursor} />
				}
			>
				Run query
			</Button>
		</>
	);
}