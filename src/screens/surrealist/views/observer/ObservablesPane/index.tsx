import classes from "./style.module.scss";

import { iconChevronLeft, iconEye } from "~/util/icons";

import { Box, type BoxProps, type ElementProps, ScrollArea, Stack, Text } from "@mantine/core";

import { ActionButton } from "~/components/ActionButton";
import { Entry } from "~/components/Entry";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { OBSERVABLE_METRIC_COLLECTIONS } from "~/constants";

interface ObservableCategoryProps extends BoxProps, ElementProps<"button"> {
	category: string;
	isActive: boolean;
	onActivate: (id: string) => void;
}

function ObservableCategoryItem({
	category,
	isActive,
	onActivate,
	...other
}: ObservableCategoryProps) {
	const handleActivate = useStable(() => {
		onActivate(category);
	});

	return (
		<Entry
			key={category}
			isActive={isActive}
			onClick={handleActivate}
			className={classes.observable}
			// leftSection={<Icon path={category?.icon ?? iconEye} />}
			{...other}
		>
			<Text
				style={{
					outline: "none",
					textOverflow: "ellipsis",
					overflow: "hidden",
				}}
			>
				{category}
			</Text>
		</Entry>
	);
}

export interface ObservablesPaneProps {
	activeCategory: string;
	onSidebarMinimize?: () => void;
	onActivate: (category: string) => void;
}

export function ObservablesPane(props: ObservablesPaneProps) {
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
						onClick={props.onSidebarMinimize}
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
							{OBSERVABLE_METRIC_COLLECTIONS.map((category) => (
								<ObservableCategoryItem
									key={category.id}
									category={category.id}
									isActive={props.activeCategory === category.id}
									onActivate={(id) => props.onActivate(id)}
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
