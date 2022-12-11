import classes from './style.module.scss';
import surrealistLogo from '~/assets/icon.png';
import { Box, Button, Group, Image, Paper, Text, TextInput } from "@mantine/core";
import { mdiCodeJson, mdiCog, mdiDatabase, mdiPin, mdiPlus, mdiTune } from "@mdi/js";
import { Icon } from "../Icon";
import { ViewTab } from "../Tab";
import { Spacer } from "./Spacer";
import { PanelSplitter } from '../PanelSplitter';
import { SplitDirection } from '@devbookhq/splitter';
import { Panel } from '../Panel';

export function Scaffold() {
	return (
		<div className={classes.root}>
			<Group p="xs" spacing="sm" bg="white">
				<Button
					color="light.0"
					px="xs"
				>
					<Icon
						path={mdiCog}
						color="light.8"
					/>
				</Button>

				<ViewTab active>
					Tab 1
				</ViewTab>

				<ViewTab>
					Tab 2
				</ViewTab>

				<ViewTab>
					Tab 3
				</ViewTab>

				<Button
					px="xs"
					variant="subtle"
					color="light"
					leftIcon={<Icon path={mdiPlus} />}
				>
					New tab
				</Button>

				<Spacer />

				<Button
					color="light.0"
					px="xs"
				>
					<Icon
						path={mdiPin}
						color="light.8"
					/>
				</Button>
			</Group>

			<Group p="xs">
				<Image
					style={{ pointerEvents: 'none', userSelect: 'none' }}
					src={surrealistLogo}
					width={42}
				/>

				<Paper className={classes.input}>
					<Paper
						bg="light.0"
						px="xs"
					>
						root
					</Paper>
					<Text>
						https://localhost:8000/
					</Text>
					<Spacer />
					<Button
						color="surreal"
						style={{ borderRadius: 0 }}
					>
						Send Query
					</Button>
				</Paper>
			</Group>

			<Box p="xs" className={classes.content}>
				<PanelSplitter>
					<PanelSplitter direction={SplitDirection.Vertical}>
						<Panel title="Query" icon={mdiDatabase}>
							
						</Panel>
						<Panel title="Variables" icon={mdiTune}>
							
						</Panel>
					</PanelSplitter>
					
					<Panel title="Result" icon={mdiCodeJson}>
						
					</Panel>
				</PanelSplitter>
			</Box>
		</div>
	)
}