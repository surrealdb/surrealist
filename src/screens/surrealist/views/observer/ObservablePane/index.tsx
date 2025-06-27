import classes from "./style.module.scss";

import { iconChevronLeft, iconEye } from "~/util/icons";

import { Box, type BoxProps, type ElementProps, ScrollArea, Stack, Text } from "@mantine/core";

import { ActionButton } from "~/components/ActionButton";
import { Entry } from "~/components/Entry";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { METRICS_OBSERVABLES } from "~/constants";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { Observable } from "~/types";

interface ObservableProps extends BoxProps, ElementProps<"button"> {
	observable: Observable;
	isActive: boolean;
	onActivate: (id: string) => void;
}

function ObservableItem({ observable, isActive, onActivate, ...other }: ObservableProps) {
	const handleActivate = useStable(() => {
		onActivate(observable.id);
	});

	return (
		<Entry
			key={observable.id}
			isActive={isActive}
			onClick={handleActivate}
			className={classes.observable}
			leftSection={<Icon path={observable?.icon ?? iconEye} />}
			{...other}
		>
			<Text
				style={{
					outline: "none",
					textOverflow: "ellipsis",
					overflow: "hidden",
				}}
			>
				{observable.label}
			</Text>
		</Entry>
	);
}

export interface ObservablePaneProps {
	activeObservable: Observable;
	onActivate: (observable: Observable) => void;
}

export function ObservablePane(props: ObservablePaneProps) {
	const isLight = useIsLight();

	return (
		<ContentPane
			icon={iconEye}
			title="Observables"
			style={{ flexShrink: 0 }}
			rightSection={
				<>
					<ActionButton
						label="Hide observables"
						onClick={() => {
							// TODO
						}}
					>
						<Icon path={iconChevronLeft} />
					</ActionButton>
				</>
			}
		>
			<Stack
				pos="absolute"
				top={0}
				left={12}
				right={12}
				bottom={12}
				gap={0}
			>
				<Box>
					<Text
						c="bright"
						fw={600}
						fz="lg"
						mb="sm"
					>
						Metrics
					</Text>
					<ScrollArea
						flex={1}
						classNames={{
							viewport: classes.scroller,
						}}
					>
						<Stack
							gap="xs"
							pb="md"
						>
							{METRICS_OBSERVABLES.map((observable) => (
								<ObservableItem
									key={observable.id}
									observable={observable}
									isActive={props.activeObservable.id === observable.id}
									onActivate={(id) =>
										props.onActivate(
											METRICS_OBSERVABLES.find((it) => it.id === id) ??
												observable,
										)
									}
								/>
							))}
						</Stack>
					</ScrollArea>
				</Box>
				<Box mt={15}>
					<Text
						c="bright"
						fw={600}
						fz="lg"
						mb="sm"
					>
						Logs
					</Text>
					<ScrollArea
						flex={1}
						classNames={{
							viewport: classes.scroller,
						}}
					>
						<Stack
							gap="xs"
							pb="md"
						>
							<Text>Coming soon</Text>
							{/* {LOG_OBSERVABLES.map((observable) => (
								<ObservableItem
									key={observable.id}
									observable={observable}
									isActive={props.activeObservable.id === observable.id}
									onActivate={(id) =>
										props.onActivate(
											LOG_OBSERVABLES.find((it) => it.id === id) ?? observable,
										)
									}
								/>
							))} */}
						</Stack>
					</ScrollArea>
				</Box>
			</Stack>
		</ContentPane>
	);
}
