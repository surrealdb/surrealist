import { Button } from "@mantine/core";
import { mdiClose } from "@mdi/js";
import { PropsWithChildren } from "react";
import { useIsLight } from "~/hooks/theme";
import { Icon } from "../Icon";

export interface ViewTabProps {
	onActivate?: () => void;
	onRename?: () => void;
	onDismiss?: () => void;
	active?: boolean;
}

export function ViewTab(props: PropsWithChildren<ViewTabProps>) {
	const isLight = useIsLight();
	const bgColor = props.active ? 'surreal' : isLight ? 'light.0' : 'dark.4';
	const fgColor = props.active ? 'white' : isLight ? 'light.9' : 'light.2';

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