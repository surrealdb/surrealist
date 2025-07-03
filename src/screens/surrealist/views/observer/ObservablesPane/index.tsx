import classes from "./style.module.scss";

import { iconChevronLeft, iconEye } from "~/util/icons";

import {
	Box,
	type BoxProps,
	Divider,
	type ElementProps,
	ScrollArea,
	Stack,
	Text,
} from "@mantine/core";

import { ActionButton } from "~/components/ActionButton";
import { Entry } from "~/components/Entry";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { useStable } from "~/hooks/stable";
import { group } from "radash";
import { OBSERVABLES } from "~/constants";
import { Observable } from "~/types";
import { Label } from "~/components/Label";

interface ObservableEntryProps extends BoxProps, ElementProps<"button"> {
	info: Observable;
	isActive: boolean;
	onActivate: (id: string) => void;
}

function ObservableEntry({ info, isActive, onActivate, ...other }: ObservableEntryProps) {
	const handleActivate = useStable(() => {
		onActivate(info.id);
	});

	return (
		<Entry
			key={info.id}
			isActive={isActive}
			onClick={handleActivate}
			className={classes.observable}
			// leftSection={<Icon path={info.icon} />}
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

export interface ObservablesPaneProps {
	active?: string;
	onSidebarMinimize?: () => void;
	onActivate: (observable: string) => void;
}

export function ObservablesPane({ active, onSidebarMinimize, onActivate }: ObservablesPaneProps) {
	const observables = group(Object.values(OBSERVABLES), (it) => it.type);

	const metrics = observables.metrics ?? [];
	const logs = observables.logs ?? [];

	return (
		<ContentPane
			icon={iconEye}
			title="Observer"
			style={{ flexShrink: 0 }}
			rightSection={
				<>
					<ActionButton
						label="Hide observables"
						onClick={onSidebarMinimize}
					>
						<Icon path={iconChevronLeft} />
					</ActionButton>
				</>
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
					<Label>Metrics</Label>
					<Stack
						gap="xs"
						mt="md"
					>
						{metrics.map((metric) => (
							<ObservableEntry
								key={metric.id}
								info={metric}
								isActive={active === metric.id}
								onActivate={onActivate}
							/>
						))}
					</Stack>
				</Box>
				<Divider my="xl" />
				<Box mt={15}>
					<Label>Logs</Label>
					<Stack
						gap="xs"
						mt="md"
					>
						{logs.map((log) => (
							<ObservableEntry
								key={log.id}
								info={log}
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
