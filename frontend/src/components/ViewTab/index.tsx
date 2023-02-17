import classes from './style.module.scss';
import { Button, UnstyledButton } from "@mantine/core";
import { mdiClose } from "@mdi/js";
import { MouseEvent, PropsWithChildren } from "react";
import { VIEW_MODES } from "~/constants";
import { useStable } from "~/hooks/stable";
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
	const tabInfo = useStoreValue(state => state.config.tabs.find(t => t.id === props.id));

	const showPlay = servingTab === props.id && isServing;
	const borderStyle = `3px solid ${props.active ? 'var(--mantine-color-surreal-6)' : 'transparent'}`

	const handleClose = useStable((e: MouseEvent) => {
		e.stopPropagation();
		props.onDismiss?.();
	})

	return (
		<Button
			px="xs"
			pt={1}
			miw={100}
			c={fgColor}
			color={bgColor}
			onClick={props.onActivate}
			onDoubleClick={props.onRename}
			styles={{
				root: {
					borderBottom: borderStyle
				},
				inner: {
					justifyContent: 'start',
				}
			}}
			rightIcon={
				<UnstyledButton
					p={0}
					w={24}
					h={24}
					c={props.active ? 'gray.0' : 'gray.5'}
					onClick={handleClose}
					className={classes.closeButton}
					component="div"
				>
					<Icon
						path={mdiClose}
						size="sm"
					/>
				</UnstyledButton>
			}
		>
			<Icon
				path={VIEW_MODES.find(v => v.id === tabInfo?.activeView)!.icon}
				size={0.9}
				left
			/>
			{props.children}
		</Button>
	)
}