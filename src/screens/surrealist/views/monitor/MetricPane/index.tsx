import { Paper, Stack } from "@mantine/core";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { iconChart, iconChevronRight } from "~/util/icons";
import { MonitorContentProps } from "../helpers";
import { MetricActions } from "./actions";

export function MetricPane({
	info,
	metricOptions,
	sidebarMinimized,
	onRevealSidebar,
	onChangeMetricsOptions,
}: MonitorContentProps) {
	return (
		<Stack h="100%">
			<ContentPane
				h="unset"
				icon={iconChart}
				title={info.name}
				withDivider={false}
				leftSection={
					sidebarMinimized && (
						<ActionButton
							label="Reveal monitors"
							mr="sm"
							color="slate"
							variant="light"
							onClick={onRevealSidebar}
							aria-label="Reveal observables"
						>
							<Icon path={iconChevronRight} />
						</ActionButton>
					)
				}
				rightSection={
					<MetricActions
						options={metricOptions}
						onChange={onChangeMetricsOptions}
					/>
				}
			/>
			<Paper
				bg="transparent"
				flex={1}
				p="xl"
			>
				Test
			</Paper>
		</Stack>
	);
}
