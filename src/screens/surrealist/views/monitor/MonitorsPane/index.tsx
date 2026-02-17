import {
	Box,
	type BoxProps,
	Divider,
	type ElementProps,
	Group,
	ScrollArea,
	Stack,
	Text,
} from "@mantine/core";
import { Icon, iconChart, iconChevronLeft, iconList } from "@surrealdb/ui";
import { group } from "radash";
import { ActionButton } from "~/components/ActionButton";
import { Entry } from "~/components/Entry";
import { Label } from "~/components/Label";
import { ContentPane } from "~/components/Pane";
import { MONITORS } from "~/constants";
import { useStable } from "~/hooks/stable";
import { Monitor } from "~/types";
import classes from "./style.module.scss";

interface ObservableEntryProps extends BoxProps, ElementProps<"button"> {
	info: Monitor;
	icon: string;
	isActive: boolean;
	onActivate: (id: string) => void;
}

function ObservableEntry({ info, icon, isActive, onActivate, ...other }: ObservableEntryProps) {
	const handleActivate = useStable(() => {
		onActivate(info.id);
	});

	return (
		<Entry
			key={info.id}
			isActive={isActive}
			onClick={handleActivate}
			className={classes.observable}
			leftSection={<Icon path={icon} />}
			compact
			{...other}
		>
			<Text
				fw={500}
				style={{
					outline: "none",
					textOverflow: "ellipsis",
					overflow: "hidden",
				}}
			>
				{info.name}
			</Text>
		</Entry>
	);
}

export interface MonitorsPaneProps {
	active?: string;
	onSidebarMinimize?: () => void;
	onActivate: (observable: string) => void;
}

export function MonitorsPane({ active, onSidebarMinimize, onActivate }: MonitorsPaneProps) {
	const observables = group(Object.values(MONITORS), (it) => it.type);

	const metrics = observables.metrics ?? [];
	const logs = observables.logs ?? [];

	return (
		<ContentPane
			icon={iconList}
			title="Monitors"
			style={{ flexShrink: 0 }}
			rightSection={
				<ActionButton
					label="Hide monitors"
					onClick={onSidebarMinimize}
				>
					<Icon path={iconChevronLeft} />
				</ActionButton>
			}
		>
			<ScrollArea
				pt="sm"
				flex={1}
				classNames={{
					viewport: classes.scroller,
				}}
			>
				<Box>
					<Group
						gap="sm"
						ml="sm"
					>
						<Label>Metrics</Label>
					</Group>
					<Stack
						gap={4}
						mt="md"
					>
						{metrics.map((metric) => (
							<ObservableEntry
								key={metric.id}
								info={metric}
								icon={iconChart}
								isActive={active === metric.id}
								onActivate={onActivate}
							/>
						))}
					</Stack>
				</Box>
				<Divider my="xl" />
				<Box>
					<Group
						gap="sm"
						ml="sm"
					>
						<Label>Logs</Label>
					</Group>
					<Stack
						gap="xs"
						mt="md"
					>
						{logs.map((log) => (
							<ObservableEntry
								key={log.id}
								info={log}
								icon={iconList}
								isActive={active === log.id}
								onActivate={onActivate}
							/>
						))}
					</Stack>
				</Box>
			</ScrollArea>
		</ContentPane>
	);
}
