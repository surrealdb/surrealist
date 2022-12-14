import Splitter, { SplitProps, SplitDirection } from '@devbookhq/splitter';
import { useIsLight } from '~/hooks/theme';
import classes from './style.module.scss';

export function PanelSplitter(props: SplitProps) {
	const isLight = useIsLight();
	const draggerClass = props.direction === SplitDirection.Vertical
		? classes.contentDraggerVertical
		: classes.contentDraggerHorizontal;

	return (
		<div
			style={{
				height: '100%',
				width: '100%',
				'--dragger-color': isLight ? '#F4F5FB' : '#09090a',
				'--dragger-opacity': isLight ? 1 : 0.25
			} as any}
		>
			<Splitter
				gutterClassName={classes.contentGutter}
				draggerClassName={draggerClass}
				{...props}
			>
				{props.children}
			</Splitter>
		</div>
	)
}