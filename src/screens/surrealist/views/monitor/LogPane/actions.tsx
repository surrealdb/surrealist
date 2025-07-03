import { Group, Select, TextInput } from "@mantine/core";
import { Updater } from "use-immer";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { MetricsDuration } from "~/types";
import { iconChevronDown, iconClock, iconRefresh, iconSearch } from "~/util/icons";
import { MonitorLogOptions } from "../helpers";

export interface LogActionsProps {
	options: MonitorLogOptions;
	isLoading: boolean;
	onChange: Updater<MonitorLogOptions>;
	onRefresh: () => void;
}

export function LogActions({ options, isLoading, onChange, onRefresh }: LogActionsProps) {
	return (
		<Group gap="sm">
			<ActionButton
				size="lg"
				label="Refresh logs"
				loading={isLoading}
				onClick={onRefresh}
			>
				<Icon path={iconRefresh} />
			</ActionButton>
			<TextInput
				leftSection={<Icon path={iconSearch} />}
				placeholder="Search logs..."
				value={options.search}
				onChange={(e) =>
					onChange((draft) => {
						draft.search = e.currentTarget.value;
					})
				}
			/>
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
			{/*
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
									!options.nodes.every((n) => options.nodeFilter.includes(n)))
							}
							variant="gradient"
							checked={
								options.nodeFilter === undefined ||
								options.nodeFilter.length > 0 ||
								options.nodes.every((n) => options.nodeFilter.includes(n))
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
			</Menu> */}
		</Group>
	);
}
