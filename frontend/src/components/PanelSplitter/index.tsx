import Splitter, { SplitProps, SplitDirection } from '@devbookhq/splitter';
import classes from './style.module.scss';

export function PanelSplitter(props: SplitProps) {
	const draggerClass = props.direction === SplitDirection.Vertical
		? classes.contentDraggerVertical
		: classes.contentDraggerHorizontal;

	return (
		<Splitter
			gutterClassName={classes.contentGutter}
			draggerClassName={draggerClass}
			{...props}
		>
			{props.children}
		</Splitter>
	)
}