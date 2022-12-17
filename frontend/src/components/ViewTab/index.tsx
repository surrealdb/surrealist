import { Button } from "@mantine/core";
import { mdiClose, mdiPlay } from "@mdi/js";
import { PropsWithChildren } from "react";
import { useIsLight } from "~/hooks/theme";
import { useStoreValue } from "~/store";
import { Icon } from "../Icon";

export interface ViewTabProps {
	id: string;
	active?: boolean;
	onActivate?: () => void;
	onRename?: () => void;
	onDismiss?: () => void;
}

export function ViewTab(props: PropsWithChildren<ViewTabProps>) {
	const isLight = useIsLight();
	const bgColor = props.active ? 'surreal' : isLight ? 'light.0' : 'dark.4';
	const fgColor = props.active ? 'white' : isLight ? 'light.9' : 'light.2';

	const servingTab = useStoreValue(state => state.servingTab);
	const isServing = useStoreValue(state => state.isServing);

	const showPlay = servingTab === props.id && isServing;

	return (
		<Button.Group>
			<Button
				px="xs"
				miw={100}
				c={fgColor}
				color={bgColor}
				onClick={props.onActivate}
				onDoubleClick={props.onRename}
				styles={{
					inner: {
						justifyContent: 'start',
					}
				}}
			>
				{showPlay && (
					<Icon
						path={mdiPlay}
						ml={-4}
						mr={4}
					/>
				)}

				{props.children}
			</Button>
			<Button
				px="xs"
				c={fgColor}
				color={bgColor}
				onClick={props.onDismiss}
			>
				<Icon
					path={mdiClose}
					size="sm"
				/>
			</Button>
		</Button.Group>
	)
}