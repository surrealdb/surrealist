import { Stack, Text } from "@mantine/core";
import { Checkbox, Group, Indicator, Menu, Select } from "@mantine/core";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { MetricsDuration } from "~/types";
import { iconChevronDown, iconClock, iconFilter } from "~/util/icons";

export interface ObserverActionsProps {
	metricsDuration: MetricsDuration;
	setMetricsDuration: (duration: MetricsDuration) => void;
	metricsNodeFilter: string[] | undefined;
	setMetricsNodeFilter: (nodes: string[] | undefined) => void;
	metricsNodes: string[];
}

export function ObserverActions({
	metricsDuration,
	setMetricsDuration,
	metricsNodeFilter,
	setMetricsNodeFilter,
	metricsNodes,
}: ObserverActionsProps) {
	return (
		<>
			<Select
				placeholder="Duration"
				size="sm"
				value={metricsDuration}
				onChange={(e) => setMetricsDuration((e as MetricsDuration) ?? "hour")}
				data={[
					{ value: "hour", label: "Last Hour" },
					{ value: "half", label: "Last 12 Hours" },
					{ value: "day", label: "Last Day" },
					{ value: "week", label: "Last Week" },
					{ value: "month", label: "Last Month" },
				]}
				leftSection={<Icon path={iconClock} />}
				rightSection={<Icon path={iconChevronDown} />}
				rightSectionWidth={30}
			/>

			<Menu>
				<Menu.Target>
					<Indicator
						disabled={
							metricsNodeFilter === undefined ||
							metricsNodeFilter.length === metricsNodes.length
						}
					>
						<ActionButton
							variant="light"
							color="slate"
							label="Node filter"
							size="lg"
						>
							<Icon
								size="md"
								path={iconFilter}
							/>
						</ActionButton>
					</Indicator>
				</Menu.Target>

				<Menu.Dropdown p="md">
					<Group>
						<Checkbox
							indeterminate={
								metricsNodeFilter !== undefined &&
								metricsNodeFilter.length > 0 &&
								!metricsNodes.every((n) => metricsNodeFilter.includes(n))
							}
							variant="gradient"
							checked={
								metricsNodeFilter === undefined ||
								metricsNodeFilter.length > 0 ||
								metricsNodes.every((n) => metricsNodeFilter.includes(n))
							}
							onChange={(e) => {
								const checked = e.currentTarget.checked;

								if (checked) {
									setMetricsNodeFilter(metricsNodes);
								} else {
									setMetricsNodeFilter([]);
								}
							}}
						/>
						<Text
							c="bright"
							fw={500}
							fz={13}
						>
							All nodes
						</Text>
					</Group>

					<Menu.Divider my="md" />

					<Stack>
						{metricsNodes.map((node, i) => (
							<Group key={i}>
								<Checkbox
									variant="gradient"
									checked={
										metricsNodeFilter?.includes(node) ||
										metricsNodeFilter === undefined
									}
									onChange={(e) => {
										const checked = e.currentTarget.checked;

										if (checked) {
											setMetricsNodeFilter([
												...(metricsNodeFilter ?? []),
												node,
											]);
										} else {
											if (metricsNodeFilter === undefined) {
												setMetricsNodeFilter(
													metricsNodes.filter((n) => n !== node),
												);
											} else {
												setMetricsNodeFilter(
													metricsNodeFilter?.filter((n) => n !== node),
												);
											}
										}
									}}
								/>
								<Text
									c="bright"
									fw={500}
								>
									{node}
								</Text>
							</Group>
						))}
					</Stack>
				</Menu.Dropdown>
			</Menu>
		</>
	);
}
