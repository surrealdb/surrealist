import { Button } from "@mantine/core";
import { mdiClose } from "@mdi/js";
import { PropsWithChildren } from "react";
import { Icon } from "../Icon";

export interface ViewTabProps {
	onDismiss?: () => void;
	active?: boolean;
}

export function ViewTab(props: PropsWithChildren<ViewTabProps>) {
	const bgColor = props.active ? 'surreal' : 'light.0';
	const fgColor = props.active ? 'white' : 'light.9';

	return (
		<Button.Group>
			<Button
				px="xs"
				miw={100}
				c={fgColor}
				color={bgColor}
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