import { Button, ScrollArea, Stack, Text } from "@mantine/core";
import { mdiHistory, mdiListBox, mdiPlus, mdiStar } from "@mdi/js";
import { Icon } from "~/components/Icon";
import { Panel } from "~/components/Panel";
import { Spacer } from "~/components/Spacer";
import { useActiveConnection } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useConfigStore } from "~/stores/config";

export function TabsPane() {
	const { addQueryTab, setActiveQueryTab } = useConfigStore.getState();
	const connection = useActiveConnection();

	const newTab = useStable(() => {
		addQueryTab();
	});

	return (
		<Panel
			icon={mdiListBox}
			title="Queries"
		>
			<Stack
				pos="absolute"
				top={0}
				left={12}
				right={12}
				bottom={12}
			>
				<ScrollArea>
					<Stack gap="sm">
						{connection.queries.map((query) => {
							const isActive = query.id === connection.activeQuery;

							return (
								<Button
									key={query.id}
									fullWidth
									color={isActive ? "surreal": "slate"}
									onClick={() => setActiveQueryTab(query.id)}
									variant="light"
									styles={{
										label: {
											flex: 1
										}
									}}
								>
									{query.name}
								</Button>
							);
						})}
						<Button
							fullWidth
							color="slate"
							variant="subtle"
							leftSection={<Icon path={mdiPlus} />}
							onClick={newTab}
						>
							New query
						</Button>
					</Stack>
				</ScrollArea>
				<Spacer />
				<Text
					c="slate"
					fz="lg"
					fw={500}
				>
					Actions
				</Text>
				<Button
					fullWidth
					color="slate"
					variant="light"
					leftSection={<Icon path={mdiStar} />}
					style={{ flexShrink: 0 }}
				>
					Saved queries
				</Button>
				<Button
					fullWidth
					color="slate"
					variant="light"
					leftSection={<Icon path={mdiHistory} />}
					style={{ flexShrink: 0 }}
				>
					Query history
				</Button>
			</Stack>
		</Panel>
	);
}