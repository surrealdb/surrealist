import classes from './style.module.scss';
import { Button, Kbd, ScrollArea, Stack, Text, Title } from "@mantine/core";
import { Spacer } from "~/components/Spacer";
import { useIsLight } from "~/hooks/theme";
import { Panel } from "~/components/Panel";
import { useIsConnected } from '~/hooks/connection';

export interface OptionsPaneProps {
	canSnapshot: boolean;
	onGenerate: () => void;
	onSnapshot: () => void;
}

export function OptionsPane(props: OptionsPaneProps) {
	const isOnline = useIsConnected();
	const isLight = useIsLight();

	return (
		<Panel>
			<ScrollArea className={classes.scrollArea}>
				<Stack spacing="xs" h="100%">
					<div>
						<Title mt="md" size={16} color={isLight ? 'light.6' : 'white'}>
							Database Visualizer
						</Title>

						<Text color={isLight ? 'light.7' : 'light.3'} mt="sm">
							The database visualizer view allows you to plot your tables and edges in a graph view.
							You can use the Designer view to modify your schema and preview the changes in the visualizer.

							<Title mt="md" size={14} color={isLight ? 'light.6' : 'light.0'}>
								How it works
							</Title>
						
							<ul className={classes.list}>
								<li>
									Edges are inferred from the schema fields <Kbd>type</Kbd> values
								</li>
								<li>
									If there are multiple edges between two tables, only one is rendered.
								</li>
								<li>
									A best attempt is made to position the nodes in a readable way.
								</li>
								<li>
									Press <Text span color={isLight ? 'black' : 'light.0'}>Visualize</Text> to generate a graph of the current database schema.
								</li>
								<li>
									Press <Text span color={isLight ? 'black' : 'light.0'}>Save snapshot</Text> to save the current graph as an image.
								</li>
							</ul>
						</Text>
					</div>

					<Spacer />

					<Button
						color="light"
						variant="light"
						onClick={props.onSnapshot}
						disabled={!isOnline || !props.canSnapshot}
					>
						Save snapshot
					</Button>

					<Button
						onClick={props.onGenerate}
						disabled={!isOnline}
					>
						Visualize
					</Button>
				</Stack>
			</ScrollArea>
		</Panel>
	);
}