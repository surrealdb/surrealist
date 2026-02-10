import { Checkbox, Group, Indicator, Menu, Select, Stack, Text } from "@mantine/core";
import { Icon, iconChevronDown, iconClock, iconFilter } from "@surrealdb/ui";
import { Updater } from "use-immer";
import { ActionButton } from "~/components/ActionButton";
import { MetricsDuration } from "~/types";
import { MonitorMetricOptions } from "../helpers";

export interface MetricActionsProps {
	options: MonitorMetricOptions;
	onChange: Updater<MonitorMetricOptions>;
}

export function MetricActions({ options, onChange }: MetricActionsProps) {
	return (
		<Group gap="sm">
			<Select
				placeholder="Duration"
				size="sm"
				value={options.duration}
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
				onChange={(e) =>
					onChange((draft) => {
						draft.duration = (e as MetricsDuration) ?? "hour";
					})
				}
			/>

			<Menu>
				<Menu.Target>
					<Indicator
						disabled={
							options.nodeFilter === undefined ||
							options.nodeFilter.length === options.nodes.length
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
								options.nodeFilter === undefined ||
								(options.nodeFilter.length > 0 &&
									!options.nodes.every((n) => options.nodeFilter?.includes(n)))
							}
							variant="gradient"
							checked={
								options.nodeFilter === undefined ||
								options.nodeFilter.length > 0 ||
								options.nodes.every((n) => options.nodeFilter?.includes(n))
							}
							onChange={(e) => {
								const checked = e.currentTarget.checked;

								if (checked) {
									onChange((draft) => {
										draft.nodeFilter = options.nodes;
									});
								} else {
									onChange((draft) => {
										draft.nodeFilter = [];
									});
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
						{options.nodes.map((node, i) => (
							<Group key={i}>
								<Checkbox
									variant="gradient"
									checked={
										options.nodeFilter?.includes(node) ||
										options.nodeFilter === undefined
									}
									onChange={(e) => {
										const checked = e.currentTarget.checked;

										if (checked) {
											onChange((draft) => {
												draft.nodeFilter = [
													...(draft.nodeFilter ?? []),
													node,
												];
											});
										} else {
											if (options.nodeFilter === undefined) {
												onChange((draft) => {
													draft.nodeFilter = options.nodes.filter(
														(n) => n !== node,
													);
												});
											} else {
												onChange((draft) => {
													draft.nodeFilter = draft.nodeFilter?.filter(
														(n) => n !== node,
													);
												});
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
		</Group>
	);
}
