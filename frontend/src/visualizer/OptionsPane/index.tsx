import { Button, Radio, Stack, Text, Title } from "@mantine/core";
import { FancyRadio } from "~/components/FancyRadio";
import { Spacer } from "~/components/Spacer";
import { useIsLight } from "~/hooks/theme";
import { SourceMode } from "~/typings";
import { Panel } from "../../components/Panel";

export interface OptionsPaneProps {
	sourceMode: SourceMode;
	setSourceMode: (sourceMode: SourceMode) => void;
	onGenerate: () => void;
}

export function OptionsPane(props: OptionsPaneProps) {
	const isLight = useIsLight();

	return (
		<Panel>
			<Stack spacing="xs" h="100%">
				<div>
					<Title mt="md" size={16} color={isLight ? 'light.6' : 'white'}>
						Source mode
					</Title>

					<Text color="light.5">
						Choose how the graph is generated
					</Text>
				</div>
				
				<Radio.Group
					value={props.sourceMode}
					onChange={props.setSourceMode}
					orientation="vertical"
				>
					<FancyRadio
						value="schema"
						title="Schema"
						subtitle="Use the schema to generate the graph"
					/>
					<FancyRadio
						value="infer"
						title="Infer"
						subtitle="Infer the graph from the database"
					/>
				</Radio.Group>

				<Spacer />

				<Button
					onClick={props.onGenerate}
				>
					Visualize
				</Button>
			</Stack>
		</Panel>
	)
}